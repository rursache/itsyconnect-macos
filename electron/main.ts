import { app, BrowserWindow, safeStorage } from "electron";
import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { createServer as createNetServer } from "node:net";
import http from "node:http";

const isDev = !app.isPackaged;
let nextProcess: ChildProcess | null = null;

// --- Master key management via macOS Keychain ---

function ensureMasterKey(): void {
  const keyPath = path.join(app.getPath("userData"), "master-key.enc");

  if (fs.existsSync(keyPath)) {
    const encrypted = fs.readFileSync(keyPath);
    process.env.ENCRYPTION_MASTER_KEY = safeStorage.decryptString(encrypted);
  } else {
    const key = randomBytes(32).toString("hex");
    const encrypted = safeStorage.encryptString(key);
    fs.writeFileSync(keyPath, encrypted);
    process.env.ENCRYPTION_MASTER_KEY = key;
  }
}

// --- Database path ---

function setDatabasePath(): void {
  process.env.DATABASE_PATH = path.join(app.getPath("userData"), "itsyship.db");
}

// --- Port finder (pure Node.js, no external deps) ---

function getRandomPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        server.close(() => resolve(addr.port));
      } else {
        server.close(() => reject(new Error("Failed to get port")));
      }
    });
    server.on("error", reject);
  });
}

// --- Next.js server ---

async function startDevServer(): Promise<number> {
  const port = 3000;
  const nextBin = path.join(app.getAppPath(), "node_modules", ".bin", "next");

  nextProcess = spawn(nextBin, ["dev", "--turbopack", "--port", String(port)], {
    env: process.env,
    stdio: "inherit",
    cwd: app.getAppPath(),
  });

  await waitForServer(port);
  return port;
}

async function startProdServer(): Promise<number> {
  const port = await getRandomPort();
  const standaloneDir = path.join(app.getAppPath(), ".next", "standalone");

  process.env.PORT = String(port);
  process.env.HOSTNAME = "127.0.0.1";
  process.chdir(standaloneDir);

  require(path.join(standaloneDir, "server.js"));

  await waitForServer(port);
  return port;
}

function waitForServer(port: number, timeout = 30_000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeout) {
          reject(new Error("Next.js server failed to start within timeout"));
          return;
        }
        setTimeout(check, 100);
      });
    }
    check();
  });
}

// --- BrowserWindow ---

let mainWindow: BrowserWindow | null = null;

function createWindow(port: number): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- App lifecycle ---

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    process.env.ELECTRON = "1";
    ensureMasterKey();
    setDatabasePath();

    const port = isDev ? await startDevServer() : await startProdServer();
    createWindow(port);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(port);
      }
    });
  });

  app.on("will-quit", () => {
    if (nextProcess) nextProcess.kill();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}
