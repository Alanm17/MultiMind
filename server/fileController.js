const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const agents = [
  {
    id: "coder",
    name: "Coder Agent",
    role: "Coding",
    description: "Writes and refactors code.",
    apiKey: "<YOUR_CODER_AGENT_API_KEY>",
  },
  {
    id: "tester",
    name: "Tester Agent",
    role: "Testing",
    description: "Writes and runs tests.",
    apiKey: "<YOUR_TESTER_AGENT_API_KEY>",
  },
  {
    id: "file_manager",
    name: "File Manager Agent",
    role: "File Management",
    description: "Manages project files.",
    apiKey: "<YOUR_FILE_MANAGER_AGENT_API_KEY>",
  },
  {
    id: "reviewer",
    name: "Reviewer Agent",
    role: "Code Review",
    description: "Reviews code for quality.",
    apiKey: "<YOUR_REVIEWER_AGENT_API_KEY>",
  },
  {
    id: "documenter",
    name: "Documenter Agent",
    role: "Documentation",
    description: "Creates and updates documentation.",
    apiKey: "<YOUR_DOCUMENTER_AGENT_API_KEY>",
  },
  {
    id: "devops",
    name: "DevOps Agent",
    role: "DevOps",
    description: "Handles deployment and CI/CD.",
    apiKey: "<YOUR_DEVOPS_AGENT_API_KEY>",
  },
];

// Helper: check project membership and role
async function checkAccess(projectId, userId, minRole = "editor") {
  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId },
  });
  if (!member) throw { status: 403, message: "Not a project member" };
  if (minRole === "editor" && member.role === "viewer")
    throw { status: 403, message: "Insufficient role" };
  return member;
}

exports.getFiles = async (req, res) => {
  const { projectId } = req.query;
  try {
    const files = await prisma.projectFile.findMany({ where: { projectId } });
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.uploadFile = async (req, res) => {
  const { projectId, filePath, content } = req.body;
  if (!projectId || !filePath || !content) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  try {
    await prisma.projectFile.create({ data: { projectId, filePath, content } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getTree = async (req, res) => {
  const { projectId } = req.params;
  try {
    await checkAccess(projectId, req.user.userId, "viewer");
    const files = await prisma.projectFile.findMany({ where: { projectId } });
    // Build tree
    const tree = {};
    files.forEach((f) => {
      const parts = f.filePath.split("/");
      let node = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!node[part]) node[part] = { __children: {}, __file: null };
        if (i === parts.length - 1) node[part].__file = f;
        node = node[part].__children;
      }
    });
    res.json(tree);
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || "Failed to get tree" });
  }
};

exports.getFile = async (req, res) => {
  const { projectId } = req.params;
  const { path } = req.query;
  try {
    await checkAccess(projectId, req.user.userId, "viewer");
    const file = await prisma.projectFile.findFirst({
      where: { projectId, filePath: String(path), isFolder: false },
    });
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || "Failed to get file" });
  }
};

exports.createFile = async (req, res) => {
  const { projectId } = req.params;
  const { path, content, parentId } = req.body;
  try {
    await checkAccess(projectId, req.user.userId, "editor");
    const exists = await prisma.projectFile.findFirst({
      where: { projectId, filePath: path, isFolder: false },
    });
    if (exists) return res.status(400).json({ error: "File already exists" });
    const file = await prisma.projectFile.create({
      data: { projectId, filePath: path, content, isFolder: false, parentId },
    });
    res.json(file);
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || "Failed to create file" });
  }
};

exports.updateFile = async (req, res) => {
  const { projectId } = req.params;
  const { path, content } = req.body;
  try {
    await checkAccess(projectId, req.user.userId, "editor");
    const file = await prisma.projectFile.updateMany({
      where: { projectId, filePath: path, isFolder: false },
      data: { content },
    });
    if (!file.count) return res.status(404).json({ error: "File not found" });
    res.json({ success: true });
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || "Failed to update file" });
  }
};

exports.deleteFile = async (req, res) => {
  const { projectId } = req.params;
  const { path } = req.body;
  try {
    await checkAccess(projectId, req.user.userId, "editor");
    await prisma.projectFile.deleteMany({
      where: { projectId, filePath: path, isFolder: false },
    });
    res.json({ success: true });
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || "Failed to delete file" });
  }
};

exports.createFolder = async (req, res) => {
  const { projectId } = req.params;
  const { path, parentId } = req.body;
  try {
    await checkAccess(projectId, req.user.userId, "editor");
    const exists = await prisma.projectFile.findFirst({
      where: { projectId, filePath: path, isFolder: true },
    });
    if (exists) return res.status(400).json({ error: "Folder already exists" });
    const folder = await prisma.projectFile.create({
      data: {
        projectId,
        filePath: path,
        content: "",
        isFolder: true,
        parentId,
      },
    });
    res.json(folder);
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || "Failed to create folder" });
  }
};

exports.renameFolder = async (req, res) => {
  const { projectId } = req.params;
  const { oldPath, newPath } = req.body;
  try {
    await checkAccess(projectId, req.user.userId, "editor");
    // Rename folder and all children
    const files = await prisma.projectFile.findMany({
      where: { projectId, filePath: { startsWith: oldPath } },
    });
    for (const file of files) {
      const updatedPath = file.filePath.replace(oldPath, newPath);
      await prisma.projectFile.update({
        where: { id: file.id },
        data: { filePath: updatedPath },
      });
    }
    res.json({ success: true });
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || "Failed to rename folder" });
  }
};

exports.deleteFolder = async (req, res) => {
  const { projectId } = req.params;
  const { path } = req.body;
  try {
    await checkAccess(projectId, req.user.userId, "editor");
    await prisma.projectFile.deleteMany({
      where: { projectId, filePath: { startsWith: path } },
    });
    res.json({ success: true });
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || "Failed to delete folder" });
  }
};
