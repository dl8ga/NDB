from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from nutbd.manager import Manager
from nutbd.executor import execute
from nutbd.core import Node, Relationship


app = FastAPI(title="NutDB API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = Manager()


class QueryRequest(BaseModel):
    database: str
    query: str


class DatabaseRequest(BaseModel):
    name: str


def serialize_node(node: Node) -> dict:
    """Преобразует Node в JSON-сериализуемый dict."""
    return {
        "id": str(node.id),
        "label": list(node.labels)[0] if node.labels else "Unknown",
        **node.props
    }


def serialize_rel(rel: Relationship) -> dict:
    """Преобразует Relationship в JSON-сериализуемый dict."""
    return {
        "id": str(rel.id) if hasattr(rel, 'id') else f"rel_{rel.start}_{rel.end}",
        "from": str(rel.start),
        "to": str(rel.end),
        "type": rel.type,
        **rel.props
    }


@app.get("/api/databases")
def list_databases():
    """Возвращает список бд"""
    databases = manager.list_dbs()
    return {"databases": databases}


@app.post("/api/database")
def create_database(request: DatabaseRequest):
    """Создаёт новую базу данных."""
    if manager.exists(request.name):
        raise HTTPException(status_code=400, detail=f"База данных '{request.name}' уже существует")
    
    manager.create(request.name)
    return {"message": f"База данных '{request.name}' создана", "database": request.name}


@app.post("/api/query")
def query(request: QueryRequest):
    """Выполняет Cypher-запрос, возвращает узлы и связи для визуализации."""
    
    if not manager.exists(request.database):
        manager.create(request.database)
    
    graph = manager.open(request.database)
    
    try:
        result = execute(graph, request.query)
        
        nodes = {}
        relationships = []
        
        for row in result:
            if isinstance(row, dict):
                for key, value in row.items():
                    if isinstance(value, Node):
                        node_id = str(value.id)
                        if node_id not in nodes:
                            nodes[node_id] = serialize_node(value)
                    
                    elif isinstance(value, Relationship):
                        relationships.append(serialize_rel(value))
            
            elif isinstance(row, Node):
                node_id = str(row.id)
                if node_id not in nodes:
                    nodes[node_id] = serialize_node(row)
            
            elif isinstance(row, Relationship):
                relationships.append(serialize_rel(row))
        
        return {
            "nodes": list(nodes.values()),
            "relationships": relationships
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/database/{db_name}/node/{node_id}")
def get_node(db_name: str, node_id: str):
    """Получаем узел по id"""
    if not manager.exists(db_name):
        raise HTTPException(status_code=404, detail=f"База данных {db_name} не найдена")
    
    graph = manager.open(db_name)
    node = graph.get_node(node_id)
    
    if not node:
        raise HTTPException(status_code=404, detail=f"Узел {node_id} не найден")
    
    return serialize_node(node)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)