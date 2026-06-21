from sqlalchemy import Column, String, Boolean, BigInteger, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
import uuid
import time
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

def epoch_ms():
    return int(time.time() * 1000)

class User(Base):
    __tablename__ = "User"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    passwordHash = Column(String, nullable=False)
    createdAt = Column(BigInteger, default=epoch_ms)
    
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "Project"
    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    name = Column(String, nullable=False)
    createdAt = Column(BigInteger, default=epoch_ms)
    
    user = relationship("User", back_populates="projects")
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    agentTasks = relationship("AgentTask", back_populates="project", cascade="all, delete-orphan")
    chatSessions = relationship("ChatSession", back_populates="project", cascade="all, delete-orphan")
    traceLogs = relationship("AgentTraceLog", back_populates="project", cascade="all, delete-orphan")
    memories = relationship("ProjectMemory", back_populates="project", cascade="all, delete-orphan")

class ProjectFile(Base):
    __tablename__ = "ProjectFile"
    id = Column(String, primary_key=True, default=generate_uuid)
    projectId = Column(String, ForeignKey("Project.id"), nullable=False)
    filePath = Column(String, nullable=False)
    content = Column(String, nullable=False)
    isFolder = Column(Boolean, default=False)
    parentId = Column(String, nullable=True)
    
    project = relationship("Project", back_populates="files")

class AgentTask(Base):
    __tablename__ = "AgentTask"
    id = Column(String, primary_key=True, default=generate_uuid)
    projectId = Column(String, ForeignKey("Project.id"), nullable=False)
    agentName = Column(String, nullable=False)
    taskDescription = Column(String, nullable=False)
    status = Column(String, nullable=False)
    createdAt = Column(BigInteger, default=epoch_ms)
    
    project = relationship("Project", back_populates="agentTasks")

class ChatSession(Base):
    __tablename__ = "ChatSession"
    id = Column(String, primary_key=True, default=generate_uuid)
    projectId = Column(String, ForeignKey("Project.id"), nullable=False)
    name = Column(String, nullable=False)
    createdAt = Column(BigInteger, default=epoch_ms)
    updatedAt = Column(BigInteger, default=epoch_ms, onupdate=epoch_ms)
    maxMessages = Column(Integer, nullable=True)
    maxTokens = Column(Integer, nullable=True)
    
    project = relationship("Project", back_populates="chatSessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    memorySummaries = relationship("MemorySummary", back_populates="session", cascade="all, delete-orphan")
    traceLogs = relationship("AgentTraceLog", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "ChatMessage"
    id = Column(String, primary_key=True, default=generate_uuid)
    sessionId = Column(String, ForeignKey("ChatSession.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    createdAt = Column(BigInteger, default=epoch_ms)
    
    session = relationship("ChatSession", back_populates="messages")

class MemorySummary(Base):
    __tablename__ = "MemorySummary"
    id = Column(String, primary_key=True, default=generate_uuid)
    sessionId = Column(String, ForeignKey("ChatSession.id"), unique=True, nullable=False)
    summary = Column(String, nullable=False)
    lastUpdated = Column(BigInteger, default=epoch_ms, onupdate=epoch_ms)
    
    session = relationship("ChatSession", back_populates="memorySummaries")

class AgentTraceLog(Base):
    __tablename__ = "AgentTraceLog"
    id = Column(String, primary_key=True, default=generate_uuid)
    sessionId = Column(String, ForeignKey("ChatSession.id"), nullable=False)
    projectId = Column(String, ForeignKey("Project.id"), nullable=True)
    agentName = Column(String, nullable=False)
    prompt = Column(String, nullable=False)
    response = Column(String, nullable=False)
    context = Column(JSON, nullable=False)
    createdAt = Column(BigInteger, default=epoch_ms)
    
    session = relationship("ChatSession", back_populates="traceLogs")
    project = relationship("Project", back_populates="traceLogs")

class ProjectMemory(Base):
    __tablename__ = "ProjectMemory"
    id = Column(String, primary_key=True, default=generate_uuid)
    projectId = Column(String, ForeignKey("Project.id"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(String, nullable=False)
    createdAt = Column(BigInteger, default=epoch_ms)
    updatedAt = Column(BigInteger, default=epoch_ms, onupdate=epoch_ms)
    
    project = relationship("Project", back_populates="memories")
