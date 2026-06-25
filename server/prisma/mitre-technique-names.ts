/** Localized MITRE technique names for in-game missions (en + uk). */
export const MITRE_TECHNIQUE_NAMES = {
  en: {
    'technique.name.T1005': 'Data from Local System',
    'technique.name.T1593': 'Search Open Websites/Domains',
    'technique.name.T1583.001': 'Acquire Infrastructure: Domains',
    'technique.name.T1566.001': 'Phishing: Spearphishing Attachment',
    'technique.name.T1059.001': 'Command and Scripting Interpreter: PowerShell',
    'technique.name.T1547.001':
      'Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder',
    'technique.name.T1087.002': 'Account Discovery: Domain Account',
    'technique.name.T1110.003': 'Brute Force: Password Spraying',
    'technique.name.T1566.002': 'Phishing: Spearphishing Link',
    'technique.name.T1021.001': 'Remote Services: Remote Desktop Protocol',
    'technique.name.T1059.003': 'Command and Scripting Interpreter: Windows Command Shell',
  },
  uk: {
    'technique.name.T1005': 'Дані з локальної системи',
    'technique.name.T1593': 'Пошук на відкритих веб-сайтах/доменах',
    'technique.name.T1583.001': 'Отримання інфраструктури: домени',
    'technique.name.T1566.001': 'Фішинг: цільовий фішинг з вкладенням',
    'technique.name.T1059.001': 'Командний та скриптовий інтерпретатор: PowerShell',
    'technique.name.T1547.001':
      'Автозапуск при завантаженні: ключі реєстру Run / папка автозапуску',
    'technique.name.T1087.002': 'Виявлення облікових записів: доменний обліковий запис',
    'technique.name.T1110.003': 'Brute Force: розпилювання паролів',
    'technique.name.T1566.002': 'Фішинг: цільовий фішинг з посиланням',
    'technique.name.T1021.001': 'Віддалені сервіси: протокол віддаленого робочого столу',
    'technique.name.T1059.003': 'Командний та скриптовий інтерпретатор: командна оболонка Windows',
  },
} as const;
