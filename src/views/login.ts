
import { setUser, setView } from '../state'
import { auth } from '../ipc'
import { Dialog } from './dialog'
import logger from 'electron-log/renderer'

export function initLogin() {
  const btn = document.getElementById('btn-login-ms') as HTMLButtonElement | null
  if (!btn) return

  btn.addEventListener('click', async () => {
    // Получаем значения из полей ввода (предполагается, что они есть в HTML)
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const username = usernameInput?.value.trim();
    const password = passwordInput?.value;

    // Проверка заполненности
    if (!username || !password) {
      await Dialog.show('Введите логин и пароль', [{ text: 'OK', type: 'ok' }]);
      return;
    }

    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Подключение...';

    try {
      // Передаём логин и пароль в IPC
      const session = await auth.login(username, password);

      if (session.success) {
        setUser(session.account);
        setView('home');
      } else {
        logger.error(session.error);
        await Dialog.show('Ошибка входа', [{ text: 'OK', type: 'ok' }]);
      }
    } catch (err) {
      logger.error(err);
      await Dialog.show('Произошла ошибка при входе.', [{ text: 'OK', type: 'ok' }]);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}
