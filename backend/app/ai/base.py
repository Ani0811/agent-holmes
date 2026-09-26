"""Abstract Base Class for AI model providers in Agent Holmes."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    id: str = Field(..., description="Unique call ID")
    name: str = Field(..., description="Function name to invoke")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Parsed arguments")


class ProviderResponse(BaseModel):
    content: Optional[str] = Field(None, description="Natural language output from the model")
    tool_calls: List[ToolCall] = Field(default_factory=list, description="List of tool calls requested")
    finish_reason: str = Field("stop", description="stop, tool_calls, length, error")
    raw_response: Optional[Dict[str, Any]] = Field(None, description="Raw provider response payload")


class AIProvider(ABC):
    """Abstract interface decoupling Agent Holmes from any specific AI/LLM platform."""

    def __init__(self, api_base: str, api_key: str = "", model: str = ""):
        self.api_base = api_base
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def chat_complete(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.0,
        max_tokens: int = 4096,
    ) -> ProviderResponse:
        """Send chat messages and tool definitions to the provider and return structured response."""
        pass

    @abstractmethod
    def get_default_system_prompt(self) -> str:
        """Return the standard system persona and instructions for software investigation."""
        pass
