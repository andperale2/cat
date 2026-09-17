using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.AccessControl;
using System.Security.Principal;
using System.ServiceProcess;
using System.Text;
using Microsoft.Win32;

namespace GameLoopCleaner
{
    class Program
    {
        private static readonly List<string> LogBuffer = new List<string>();
        private static string logFilePath = "cleanup_log.txt";

        static void Main(string[] args)
        {
            Console.Title = "GameLoop & Tencent Deep Cleaner - Senior Windows Tool";
            logFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "cleanup_log.txt");

            PrintHeader();

            if (!IsAdministrator())
            {
                WriteColor("[-] Este programa requiere privilegios de Administrador.", ConsoleColor.Red);
                WriteColor("[*] Intentando reiniciar con privilegios elevados (UAC)...", ConsoleColor.Yellow);
                ElevateToAdmin();
                return;
            }

            WriteColor("[+] Ejecutando con permisos de Administrador.", ConsoleColor.Green);
            Log("=== Inicio de Limpieza GameLoop / Tencent ===");
            Log("Fecha y hora: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));

            Console.WriteLine();
            WriteColor("=== PASO 1: Creando Punto de Restauracion del Sistema / Respaldo ===", ConsoleColor.Cyan);
            CreateSystemRestorePoint();

            Console.WriteLine();
            WriteColor("=== PASO 2: Deteniendo y Eliminando Servicios y Procesos ===", ConsoleColor.Cyan);
            KillProcessesAndServices();

            Console.WriteLine();
            WriteColor("=== PASO 3: Limpieza Profunda del Sistema de Archivos (C:, D:, E:) ===", ConsoleColor.Cyan);
            CleanFileSystem();

            Console.WriteLine();
            WriteColor("=== PASO 4: Limpieza Profunda del Registro de Windows (Regedit) ===", ConsoleColor.Cyan);
            CleanRegistry();

            Console.WriteLine();
            WriteColor("=== PASO 5: Finalizando y Guardando Reporte ===", ConsoleColor.Cyan);
            SaveLogFile();

            WriteColor("\n[✔] Proceso de limpieza completado con exito.", ConsoleColor.Green);
            WriteColor("[i] El archivo de registro detallado se ha guardado en: " + logFilePath, ConsoleColor.Yellow);
            Console.WriteLine("\nPresione cualquier tecla para salir...");
            Console.ReadKey();
        }

        #region Helpers & UI

        private static bool IsAdministrator()
        {
            using (WindowsIdentity identity = WindowsIdentity.GetCurrent())
            {
                WindowsPrincipal principal = new WindowsPrincipal(identity);
                return principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
        }

        private static void ElevateToAdmin()
        {
            try
            {
                ProcessStartInfo proc = new ProcessStartInfo
                {
                    UseShellExecute = true,
                    WorkingDirectory = Environment.CurrentDirectory,
                    FileName = Assembly.GetExecutingAssembly().Location,
                    Verb = "runas"
                };
                Process.Start(proc);
            }
            catch (Exception ex)
            {
                WriteColor("[-] No se pudo elevar los privilegios de Administrador: " + ex.Message, ConsoleColor.Red);
            }
        }

        private static void PrintHeader()
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine(@"
========================================================================
       GAMELOOP & TENCENT GAMING BUDDY - HERRAMIENTA DE PURGA
========================================================================
");
            Console.ResetColor();
        }

        private static void WriteColor(string text, ConsoleColor color)
        {
            Console.ForegroundColor = color;
            Console.WriteLine(text);
            Console.ResetColor();
            Log(text);
        }

        private static void Log(string message)
        {
            LogBuffer.Add("[" + DateTime.Now.ToString("HH:mm:ss") + "] " + message);
        }

        private static void SaveLogFile()
        {
            try
            {
                File.WriteAllLines(logFilePath, LogBuffer.ToArray(), Encoding.UTF8);
                WriteColor("[+] Log guardado exitosamente en: " + logFilePath, ConsoleColor.Green);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[-] Error al guardar el archivo de log: " + ex.Message);
            }
        }

        private static void RunCommand(string filename, string arguments)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = filename,
                    Arguments = arguments,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit(10000);
                }
            }
            catch { }
        }

        #endregion

        #region Step 1: System Restore Point

        private static void CreateSystemRestorePoint()
        {
            try
            {
                WriteColor("[*] Solicitando creacion de Punto de Restauracion del Sistema...", ConsoleColor.Yellow);
                string psCommand = "Checkpoint-Computer -Description \"Pre-GameLoop-Cleanup\" -RestorePointType \"MODIFY_SETTINGS\"";
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-NoProfile -ExecutionPolicy Bypass -Command \"" + psCommand + "\"",
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit(15000);
                }
                WriteColor("[+] Intentada la creacion del punto de restauracion.", ConsoleColor.Green);
            }
            catch (Exception ex)
            {
                WriteColor("[!] Advertencia al crear punto de restauracion: " + ex.Message, ConsoleColor.Yellow);
            }
        }

        #endregion

        #region Step 2: Processes & Services

        private static void KillProcessesAndServices()
        {
            string[] processNames = new string[]
            {
                "AppMarket", "AndroidProcess", "QMEmulatorService", "GameLoop",
                "TSettingCenter", "aow_exe", "TxGameAssistant", "TencentLBS",
                "SycnSvc", "SycnServer", "TencentDL", "TencentURL", "TencentNetFilter",
                "QQProtect", "TP3Service"
            };

            foreach (string procName in processNames)
            {
                try
                {
                    Process[] procs = Process.GetProcessesByName(procName);
                    foreach (Process p in procs)
                    {
                        try
                        {
                            p.Kill();
                            p.WaitForExit(2000);
                            WriteColor("[+] Proceso finalizado: " + p.ProcessName + " (PID: " + p.Id + ")", ConsoleColor.Green);
                        }
                        catch (Exception ex)
                        {
                            WriteColor("[!] Error al finalizar proceso " + procName + ": " + ex.Message, ConsoleColor.Yellow);
                        }
                    }
                }
                catch { }
            }

            // Also force taskkill for any remaining matches
            RunCommand("taskkill.exe", "/F /IM AppMarket.exe /T");
            RunCommand("taskkill.exe", "/F /IM AndroidProcess.exe /T");
            RunCommand("taskkill.exe", "/F /IM QMEmulatorService.exe /T");
            RunCommand("taskkill.exe", "/F /IM GameLoop.exe /T");
            RunCommand("taskkill.exe", "/F /IM TSettingCenter.exe /T");
            RunCommand("taskkill.exe", "/F /IM aow_exe.exe /T");

            // Services
            string[] serviceNames = new string[]
            {
                "QMEmulatorService", "TFsDriver", "TP3Service", "aow_drv",
                "TencentNetFilter", "SycnSvc", "TencentLBS"
            };

            foreach (string serviceName in serviceNames)
            {
                try
                {
                    ServiceController sc = new ServiceController(serviceName);
                    if (sc.Status != ServiceControllerStatus.Stopped && sc.Status != ServiceControllerStatus.StopPending)
                    {
                        sc.Stop();
                        sc.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(5));
                        WriteColor("[+] Servicio detenido: " + serviceName, ConsoleColor.Green);
                    }
                }
                catch { }

                // Delete service via sc.exe
                RunCommand("sc.exe", "stop " + serviceName);
                RunCommand("sc.exe", "delete " + serviceName);
            }
        }

        #endregion

        #region Step 3: File System Cleaning

        private static void CleanFileSystem()
        {
            List<string> directTargetPaths = new List<string>();

            // Known system / user paths
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            string programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            string winDir = Environment.GetFolderPath(Environment.SpecialFolder.Windows);

            // AppData / User specific
            directTargetPaths.Add(Path.Combine(appData, "Tencent"));
            directTargetPaths.Add(Path.Combine(localAppData, "Tencent"));
            directTargetPaths.Add(Path.Combine(userProfile, ".GameLoopBox"));
            directTargetPaths.Add(Path.Combine(localAppData, "Temp\\Tencent"));
            directTargetPaths.Add(Path.Combine(winDir, "Temp\\Tencent"));

            // Root system / drives specific
            string[] driveLetters = new string[] { "C:\\", "D:\\", "E:\\" };
            foreach (string drive in driveLetters)
            {
                if (Directory.Exists(drive))
                {
                    directTargetPaths.Add(Path.Combine(drive, "Program Files\\Tencent"));
                    directTargetPaths.Add(Path.Combine(drive, "Program Files (x86)\\Tencent"));
                    directTargetPaths.Add(Path.Combine(drive, "Program Files\\TxGameAssistant"));
                    directTargetPaths.Add(Path.Combine(drive, "Program Files (x86)\\TxGameAssistant"));
                    directTargetPaths.Add(Path.Combine(drive, "ProgramData\\Tencent"));
                    directTargetPaths.Add(Path.Combine(drive, "ProgramData\\TxGameAssistant"));
                    directTargetPaths.Add(Path.Combine(drive, "TxGameAssistant"));
                    directTargetPaths.Add(Path.Combine(drive, "GameLoop"));
                    directTargetPaths.Add(Path.Combine(drive, "Temp\\Tencent"));
                    directTargetPaths.Add(Path.Combine(drive, "Temp\\TxGameAssistant"));
                }
            }

            // Clean direct targets
            foreach (string target in directTargetPaths.Distinct())
            {
                if (Directory.Exists(target))
                {
                    ForceDeleteDirectory(target);
                }
                else if (File.Exists(target))
                {
                    ForceDeleteFile(target);
                }
            }

            // User AppData Temp scanning
            try
            {
                string usersDir = Path.GetDirectoryName(userProfile);
                if (Directory.Exists(usersDir))
                {
                    string[] userDirs = Directory.GetDirectories(usersDir);
                    foreach (string uDir in userDirs)
                    {
                        string tencentTemp = Path.Combine(uDir, @"AppData\Local\Temp\Tencent");
                        if (Directory.Exists(tencentTemp))
                        {
                            ForceDeleteDirectory(tencentTemp);
                        }
                    }
                }
            }
            catch { }

            // Prefetch cleaning
            try
            {
                string prefetchDir = Path.Combine(winDir, "Prefetch");
                if (Directory.Exists(prefetchDir))
                {
                    string[] prefetchFiles = Directory.GetFiles(prefetchDir, "*GAMELOOP*").Concat(Directory.GetFiles(prefetchDir, "*TENCENT*")).ToArray();
                    foreach (string pf in prefetchFiles)
                    {
                        ForceDeleteFile(pf);
                    }
                }
            }
            catch { }

            // Drivers cleaning
            try
            {
                string driversDir = Path.Combine(winDir, @"System32\drivers");
                if (Directory.Exists(driversDir))
                {
                    string[] driverPatterns = new string[] { "TFsDriver*.sys", "aow_drv*.sys", "TP3Service*.sys", "Tencent*.sys" };
                    foreach (string pattern in driverPatterns)
                    {
                        string[] sysFiles = Directory.GetFiles(driversDir, pattern);
                        foreach (string sf in sysFiles)
                        {
                            ForceDeleteFile(sf);
                        }
                    }
                }
            }
            catch { }

            // Drive root wildcard scan
            foreach (string drive in driveLetters)
            {
                if (Directory.Exists(drive))
                {
                    ScanAndCleanDriveRootPattern(drive);
                }
            }
        }

        private static void ScanAndCleanDriveRootPattern(string driveRoot)
        {
            try
            {
                string[] subDirs = Directory.GetDirectories(driveRoot);
                foreach (string dir in subDirs)
                {
                    string name = Path.GetFileName(dir).ToLower();
                    if (name.Contains("tencent") || name.Contains("gameloop") || name.Contains("txgameassistant") || name.Contains("ui_log"))
                    {
                        ForceDeleteDirectory(dir);
                    }
                }
            }
            catch { }
        }

        private static void ForceDeleteFile(string filePath)
        {
            try
            {
                if (!File.Exists(filePath)) return;

                File.SetAttributes(filePath, FileAttributes.Normal);
                File.Delete(filePath);
                WriteColor("[+] Archivo eliminado: " + filePath, ConsoleColor.Green);
            }
            catch
            {
                // Try takeown and icacls
                RunCommand("takeown.exe", "/F \"" + filePath + "\" /A");
                RunCommand("icacls.exe", "\"" + filePath + "\" /grant administrators:F");
                try
                {
                    File.SetAttributes(filePath, FileAttributes.Normal);
                    File.Delete(filePath);
                    WriteColor("[+] Archivo eliminado (forzado): " + filePath, ConsoleColor.Green);
                }
                catch (Exception ex)
                {
                    WriteColor("[!] No se pudo eliminar el archivo " + filePath + ": " + ex.Message, ConsoleColor.Yellow);
                }
            }
        }

        private static void ForceDeleteDirectory(string dirPath)
        {
            try
            {
                if (!Directory.Exists(dirPath)) return;

                // Take ownership recursively first to prevent access denied
                RunCommand("takeown.exe", "/F \"" + dirPath + "\" /R /D Y");
                RunCommand("icacls.exe", "\"" + dirPath + "\" /grant administrators:F /T /C /Q");

                ResetAttributesRecursive(new DirectoryInfo(dirPath));
                Directory.Delete(dirPath, true);
                WriteColor("[+] Directorio eliminado: " + dirPath, ConsoleColor.Green);
            }
            catch (Exception ex)
            {
                // Fallback attempt via cmd rmdir
                RunCommand("cmd.exe", "/c rmdir /s /q \"" + dirPath + "\"");
                if (!Directory.Exists(dirPath))
                {
                    WriteColor("[+] Directorio eliminado (rmdir): " + dirPath, ConsoleColor.Green);
                }
                else
                {
                    WriteColor("[!] Error al borrar directorio " + dirPath + ": " + ex.Message, ConsoleColor.Yellow);
                }
            }
        }

        private static void ResetAttributesRecursive(DirectoryInfo di)
        {
            try
            {
                di.Attributes = FileAttributes.Normal;
                foreach (FileInfo file in di.GetFiles())
                {
                    file.Attributes = FileAttributes.Normal;
                }
                foreach (DirectoryInfo subDir in di.GetDirectories())
                {
                    ResetAttributesRecursive(subDir);
                }
            }
            catch { }
        }

        #endregion

        #region Step 4: Registry Cleaning

        private static void CleanRegistry()
        {
            // Known specific registry subkeys
            string[] targetKeysHKCU = new string[]
            {
                @"SOFTWARE\Tencent",
                @"SOFTWARE\GameLoop",
                @"SOFTWARE\TxGameAssistant",
                @"Software\Microsoft\Windows\CurrentVersion\Uninstall\MobileGamePC",
                @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Tencent",
                @"Software\Microsoft\Windows\CurrentVersion\Uninstall\GameLoop"
            };

            string[] targetKeysHKLM = new string[]
            {
                @"SOFTWARE\Tencent",
                @"SOFTWARE\GameLoop",
                @"SOFTWARE\TxGameAssistant",
                @"SOFTWARE\WOW6432Node\Tencent",
                @"SOFTWARE\WOW6432Node\GameLoop",
                @"SOFTWARE\WOW6432Node\TxGameAssistant",
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\MobileGamePC",
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Tencent",
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\GameLoop",
                @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\MobileGamePC",
                @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Tencent",
                @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\GameLoop",
                @"SYSTEM\CurrentControlSet\Services\QMEmulatorService",
                @"SYSTEM\CurrentControlSet\Services\TFsDriver",
                @"SYSTEM\CurrentControlSet\Services\TP3Service",
                @"SYSTEM\CurrentControlSet\Services\aow_drv"
            };

            foreach (string subkey in targetKeysHKCU)
            {
                DeleteRegistrySubKeyTree(Registry.CurrentUser, subkey);
            }

            foreach (string subkey in targetKeysHKLM)
            {
                DeleteRegistrySubKeyTree(Registry.LocalMachine, subkey);
            }

            // Search Uninstall keys in HKCU & HKLM for DisplayName matching Tencent or GameLoop
            CleanUninstallEntries(Registry.CurrentUser, @"Software\Microsoft\Windows\CurrentVersion\Uninstall");
            CleanUninstallEntries(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall");
            CleanUninstallEntries(Registry.LocalMachine, @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall");

            // Clean Run and RunOnce entries
            CleanRunEntries(Registry.CurrentUser, @"Software\Microsoft\Windows\CurrentVersion\Run");
            CleanRunEntries(Registry.CurrentUser, @"Software\Microsoft\Windows\CurrentVersion\RunOnce");
            CleanRunEntries(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run");
            CleanRunEntries(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce");
            CleanRunEntries(Registry.LocalMachine, @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run");

            // Clean Compatibility Assistant & MuiCache
            CleanCompatibilityAndMuiCache();

            // Perform deep scan in HKEY_USERS for HKU loaded profiles
            CleanHKeyUsers();
        }

        private static void DeleteRegistrySubKeyTree(RegistryKey rootKey, string subkeyPath)
        {
            try
            {
                bool exists = false;
                using (RegistryKey key = rootKey.OpenSubKey(subkeyPath, false))
                {
                    if (key != null)
                    {
                        exists = true;
                    }
                }

                if (exists)
                {
                    rootKey.DeleteSubKeyTree(subkeyPath);
                    WriteColor("[+] Clave de registro eliminada: " + rootKey.Name + "\\" + subkeyPath, ConsoleColor.Green);
                }
            }
            catch (Exception ex)
            {
                WriteColor("[!] No se pudo eliminar la clave de registro " + rootKey.Name + "\\" + subkeyPath + ": " + ex.Message, ConsoleColor.Yellow);
            }
        }

        private static void CleanUninstallEntries(RegistryKey rootKey, string uninstallKeyPath)
        {
            try
            {
                List<string> keysToDelete = new List<string>();

                using (RegistryKey uninstallKey = rootKey.OpenSubKey(uninstallKeyPath, false))
                {
                    if (uninstallKey == null) return;

                    string[] subkeyNames = uninstallKey.GetSubKeyNames();
                    foreach (string name in subkeyNames)
                    {
                        try
                        {
                            using (RegistryKey subkey = uninstallKey.OpenSubKey(name, false))
                            {
                                if (subkey != null)
                                {
                                    string displayName = subkey.GetValue("DisplayName") as string ?? "";
                                    string publisher = subkey.GetValue("Publisher") as string ?? "";

                                    if (displayName.IndexOf("GameLoop", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                        displayName.IndexOf("Tencent", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                        publisher.IndexOf("Tencent", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                        name.IndexOf("Tencent", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                        name.IndexOf("GameLoop", StringComparison.OrdinalIgnoreCase) >= 0)
                                    {
                                        keysToDelete.Add(name);
                                    }
                                }
                            }
                        }
                        catch { }
                    }
                }

                if (keysToDelete.Count > 0)
                {
                    using (RegistryKey uninstallKey = rootKey.OpenSubKey(uninstallKeyPath, true))
                    {
                        if (uninstallKey != null)
                        {
                            foreach (string name in keysToDelete)
                            {
                                try
                                {
                                    uninstallKey.DeleteSubKeyTree(name);
                                    WriteColor("[+] Entrada de desinstalacion eliminada: " + uninstallKeyPath + "\\" + name, ConsoleColor.Green);
                                }
                                catch { }
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private static void CleanRunEntries(RegistryKey rootKey, string runKeyPath)
        {
            try
            {
                using (RegistryKey runKey = rootKey.OpenSubKey(runKeyPath, true))
                {
                    if (runKey == null) return;

                    string[] valueNames = runKey.GetValueNames();
                    foreach (string name in valueNames)
                    {
                        string val = runKey.GetValue(name) as string ?? "";
                        if (name.IndexOf("Tencent", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            name.IndexOf("GameLoop", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            val.IndexOf("Tencent", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            val.IndexOf("GameLoop", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            val.IndexOf("TxGameAssistant", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            runKey.DeleteValue(name, false);
                            WriteColor("[+] Entrada de inicio automatico eliminada: " + runKeyPath + " -> " + name, ConsoleColor.Green);
                        }
                    }
                }
            }
            catch { }
        }

        private static void CleanCompatibilityAndMuiCache()
        {
            // AppCompatFlags Store
            try
            {
                string compatPath = @"Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Compatibility Assistant\Store";
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(compatPath, true))
                {
                    if (key != null)
                    {
                        foreach (string valName in key.GetValueNames())
                        {
                            if (valName.IndexOf("GameLoop", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                valName.IndexOf("Tencent", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                valName.IndexOf("TxGameAssistant", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                valName.IndexOf("AppMarket", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                key.DeleteValue(valName, false);
                                WriteColor("[+] Entrada AppCompatFlags eliminada: " + valName, ConsoleColor.Green);
                            }
                        }
                    }
                }
            }
            catch { }

            // Shell MuiCache
            try
            {
                string muiPath = @"Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\MuiCache";
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(muiPath, true))
                {
                    if (key != null)
                    {
                        foreach (string valName in key.GetValueNames())
                        {
                            string valData = key.GetValue(valName) as string ?? "";
                            if (valName.IndexOf("GameLoop", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                valName.IndexOf("Tencent", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                valName.IndexOf("TxGameAssistant", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                valData.IndexOf("GameLoop", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                valData.IndexOf("Tencent", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                key.DeleteValue(valName, false);
                                WriteColor("[+] Entrada MuiCache eliminada: " + valName, ConsoleColor.Green);
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private static void CleanHKeyUsers()
        {
            try
            {
                string[] subKeys = Registry.Users.GetSubKeyNames();
                foreach (string sid in subKeys)
                {
                    if (sid.EndsWith("_Classes", StringComparison.OrdinalIgnoreCase)) continue;

                    string userTencentKey = sid + @"\Software\Tencent";
                    string userGameLoopKey = sid + @"\Software\GameLoop";

                    DeleteRegistrySubKeyTree(Registry.Users, userTencentKey);
                    DeleteRegistrySubKeyTree(Registry.Users, userGameLoopKey);
                }
            }
            catch { }
        }

        #endregion
    }
}
