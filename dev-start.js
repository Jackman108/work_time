// Простой скрипт для запуска dev-режима без дополнительных зависимостей
const { spawn, exec } = require('child_process');
const os = require('os');

// Устанавливаем UTF-8 кодировку для Windows консоли
if (os.platform() === 'win32') {
  try {
    exec('chcp 65001', () => {});
  } catch (e) {
    // Игнорируем ошибки установки кодировки
  }
}

/**
 * Функция для освобождения порта (опционально, если занят)
 * @param {number} port - Порт для освобождения
 * @returns {Promise<void>}
 */
function killPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (_error, stdout) => {
      if (stdout) {
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 0) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(Number(pid))) {
              pids.add(pid);
            }
          }
        });
        pids.forEach(pid => {
          exec(`taskkill /F /PID ${pid}`, () => {});
        });
        if (pids.size > 0) {
          console.log(`⚠️  Освобождаю порт ${port}...\n`);
          setTimeout(() => resolve(), 1000);
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  });
}

console.log('🚀 Запуск dev-режима...\n');

// Компилируем TypeScript
console.log('📝 Компиляция TypeScript...\n');
const tsc = spawn('npx', ['tsc', '-p', 'tsconfig.main.json'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

tsc.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Ошибка компиляции TypeScript');
    process.exit(1);
  }
  
  console.log('✅ TypeScript скомпилирован\n');
  
  // Преобразуем алиасы путей в относительные пути
  console.log('🔄 Преобразование алиасов путей...\n');
  const tscAlias = spawn('npx', ['tsc-alias', '-p', 'tsconfig.main.json'], {
    cwd: __dirname,
    shell: true,
    stdio: 'inherit'
  });
  
  tscAlias.on('close', (aliasCode) => {
    if (aliasCode !== 0) {
      console.error('❌ Ошибка преобразования алиасов');
      process.exit(1);
    }
    
    console.log('✅ Алиасы преобразованы\n');
    
    // Освобождаем порт перед запуском
    killPort(5173).then(() => {

    // Запускаем Vite dev server
    const vite = spawn('npx', ['vite'], {
      cwd: require('path').join(__dirname, 'renderer'),
      shell: true,
      stdio: 'inherit'
    });

    // Ждем 3 секунды и запускаем Electron
    setTimeout(() => {
      console.log('⚡ Запуск Electron...\n');
      const electron = spawn('npx', ['electron', '.'], {
        cwd: __dirname,
        shell: true,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });

      electron.on('close', () => {
        console.log('Electron закрыт');
        vite.kill();
        process.exit(0);
      });
    }, 3000);

    vite.on('close', () => {
      console.log('Vite закрыт');
      process.exit(0);
    });

    });
  });
});

