import { ipcMain, app } from 'electron';
import { AzAuth } from 'eml-lib';          // ✅ Правильный импорт из документации
import type { Account } from 'eml-lib';
import logger from 'electron-log/main';
import * as fs from 'node:fs';
import * as path from 'node:path';

const sessionPath = path.join(app.getPath('userData'), 'session.json');

export type IAuthResponse = { success: true; account: Account } | { success: false; error?: string };

export function registerAuthHandlers(_mainWindow: Electron.BrowserWindow) {
  // Создаём экземпляр AzAuth с URL вашего сайта
  const auth = new AzAuth('https://rovexplay.ru');

  // Вход с логином и паролем
  ipcMain.handle('auth:login', async (_event, username: string, password: string) => {
    try {
      logger.info(`Attempting Azuriom login for user: ${username}`);
      // Используем метод auth() как в документации
      const account = await auth.auth(username, password);
      fs.writeFileSync(sessionPath, JSON.stringify(account));
      return { success: true, account } as IAuthResponse;
    } catch (err: any) {
      logger.error('Failed to login:', err);
      return { success: false, error: err.message ?? 'Unknown error' };
    }
  });

  // Восстановление сессии при старте (без проверки)
  ipcMain.handle('auth:refresh', async () => {
    if (!fs.existsSync(sessionPath)) {
      return { success: false };
    }
    try {
      const data = fs.readFileSync(sessionPath, 'utf-8');
      const savedSession = JSON.parse(data) as Account;
      if (savedSession && savedSession.uuid) {
        return { success: true, account: savedSession } as IAuthResponse;
      }
      return { success: false };
    } catch (err: any) {
      logger.error('Failed to read session:', err);
      return { success: false, error: err.message };
    }
  });

  // Выход
  ipcMain.handle('auth:logout', () => {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
    return { success: true };
  });
}
