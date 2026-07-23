from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from mental_health_resources import get_all_resources, get_resources_by_category, search_resources, MENTAL_HEALTH_RESOURCES
router = APIRouter()

class ResourceResponse(BaseModel):
    id: int
    problem: str
    description: str
    symptoms: List[str]
    solutions: List[str]
    category: str

class CategoryListResponse(BaseModel):
    categories: List[str]

@router.get("/", response_model=List[ResourceResponse])
async def get_resources(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search query")
):
    """
    Get mental health resources.
    - Can filter by category
    - Can search by keywords
    - Returns all resources if no filters applied
    """
    if search:
        return search_resources(search)
    elif category:
        resources = get_resources_by_category(category)
        return [{"category": category, **r} for r in resources]
    else:
        return get_all_resources()

@router.get("/categories", response_model=CategoryListResponse)
async def get_categories():
    """Get list of all resource categories"""
    return {"categories": list(MENTAL_HEALTH_RESOURCES.keys())}

@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource_by_id(resource_id: int):
    """Get a specific resource by ID"""
    all_resources = get_all_resources()
    for resource in all_resources:
        if resource['id'] == resource_id:
            return resource
    # Return a proper 404 when resource is not found so response_model validation
    # doesn't attempt to coerce an error dict into ResourceResponse.
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Resource not found")
