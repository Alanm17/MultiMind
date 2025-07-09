const { v4: uuidv4 } = require("uuid");
const projectService = require("../services/projectService");
const { ensureProject } = require("../services/projectService");
const archiver = require("archiver");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.create = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ error: "Project name required" });

    const project = await projectService.ensureProject({
      id: uuidv4(),
      name,
      userId,
    });
    res.status(201).json({ project });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    // For development, return all projects without user filtering
    const projects = await prisma.project.findMany();
    res.json({ projects });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name } = req.body;
    const project = await projectService.getProjectById(id);
    if (!project || project.userId !== userId)
      return res.status(404).json({ error: "Project not found" });
    const updated = await projectService.updateProject(id, name);
    res.json({ project: updated });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const project = await projectService.getProjectById(id);
    if (!project || project.userId !== userId)
      return res.status(404).json({ error: "Project not found" });
    await projectService.deleteProject(id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.downloadProjectZip = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });
    const files = await prisma.projectFile.findMany({
      where: { projectId: id },
    });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.name || "project"}.zip"`
    );
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);
    for (const file of files) {
      archive.append(file.content, { name: file.filePath });
    }
    await archive.finalize();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.addMember = async (req, res) => {
  const { projectId } = req.params;
  const { userId, role } = req.body;
  // Only allow if current user is owner
  const isOwner = await prisma.projectMember.findFirst({
    where: { projectId, userId: req.user.userId, role: "owner" },
  });
  if (!isOwner)
    return res.status(403).json({ error: "Only owner can add members" });
  await prisma.projectMember.create({ data: { projectId, userId, role } });
  res.json({ success: true });
};

exports.listMembers = async (req, res) => {
  const { projectId } = req.params;
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true },
  });
  res.json(members);
};

exports.removeMember = async (req, res) => {
  const { projectId, userId } = req.params;
  // Only allow if current user is owner
  const isOwner = await prisma.projectMember.findFirst({
    where: { projectId, userId: req.user.userId, role: "owner" },
  });
  if (!isOwner)
    return res.status(403).json({ error: "Only owner can remove members" });
  await prisma.projectMember.deleteMany({ where: { projectId, userId } });
  res.json({ success: true });
};
