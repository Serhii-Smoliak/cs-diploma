/** Full MITRE technique descriptions for operation_ghost missions (en + uk). */
export const MITRE_TECHNIQUE_DESCRIPTIONS = {
  en: {
    'technique.description.T1593':
      'Adversaries may search freely available websites and/or domains for information about victims that can be used during targeting. Information about victims may be available in various online sites, such as social media, news sites, or those hosting information about business operations such as hiring or requested/rewarded contracts. Adversaries may search in different online sites depending on what information they seek to gather. Information from these sources may reveal opportunities for other forms of reconnaissance, establishing operational resources, and/or initial access.',
    'technique.description.T1583.001':
      'Adversaries may acquire domains that can be used during targeting. Domain names are the human readable names used to represent one or more IP addresses. They can be purchased or, in some cases, acquired for free. Adversaries may use acquired domains for phishing, drive-by compromise, and command and control. They may choose domains similar to legitimate ones, including homoglyphs or different top-level domains. Typosquatting helps deliver payloads via drive-by compromise. Adversaries may also use internationalized domain names and similar character sets for homograph attacks. They may acquire expired domains with existing reputation, use private WHOIS to hide ownership, or register domains in compromised cloud environments.',
    'technique.description.T1566.001':
      'Adversaries may send spearphishing emails with a malicious attachment in an attempt to gain access to victim systems. This variant relies on malware attached to an email and usually depends on user execution after opening the file. Attachments may include Office documents, executables, PDFs, or archives. The email text gives a plausible reason to open the file and may explain how to bypass protections or decrypt a password-protected archive. Adversaries often manipulate extensions and icons so executables look like documents.',
    'technique.description.T1059.001':
      'Adversaries may abuse PowerShell commands and scripts for execution. PowerShell is a powerful command-line interface and scripting environment in Windows. Adversaries use it for discovery and code execution, including downloading and running executables from the Internet from disk or in memory. PowerShell can also be invoked without powershell.exe through .NET interfaces to the underlying automation assembly.',
    'technique.description.T1547.001':
      "Adversaries may achieve persistence by adding a program to a startup folder or referencing it with a Registry run key. Adding an entry to run keys or the startup folder causes the program to execute when a user logs in, under that user's permissions. Default Windows run keys include HKCU and HKLM Run and RunOnce paths. Startup folders exist per user and system-wide. Adversaries may also use RunServices, Policies\\Explorer\\Run, BootExecute, and related locations to launch malware after reboot and may masquerade entries as legitimate programs.",
    'technique.description.T1087.002':
      'Adversaries may attempt to get a listing of domain accounts and groups. This information can help identify targets for credential access, lateral movement, or privilege escalation. Account listings may include users, service accounts, and groups with elevated permissions. Service accounts often have predictable naming and weaker password policies.',
    'technique.description.T1110.003':
      'Adversaries may use a single or small list of commonly used passwords against many accounts to avoid account lockouts. Password spraying targets many accounts with one password before moving to the next password, often with delays between attempts to evade detection and lockout policies.',
    'technique.description.T1566.002':
      'Adversaries may send spearphishing messages with a malicious link to trick users into revealing credentials or downloading malware. Links may point to fake login pages, OAuth consent screens, or staged payloads. Unlike attachment-based phishing, link-based attacks rely on the user clicking a URL rather than opening a file.',
    'technique.description.T1021.001':
      'Adversaries may use Remote Desktop Protocol to laterally move to remote systems on a network. RDP is commonly used for legitimate administration; adversaries may reuse stolen credentials or pass-the-hash to access jump hosts, servers, or workstations.',
    'technique.description.T1059.003':
      'Adversaries may abuse the Windows Command Shell (cmd.exe) for execution. Commands can download files (certutil, bitsadmin), run scripts, or invoke other tools. cmd is often less monitored than PowerShell in hardened environments.',
  },
  uk: {
    'technique.description.T1593':
      'Зловмисники можуть шукати на вільно доступних веб-сайтах і доменах інформацію про жертв для подальшого таргетингу. Такі дані часто є в соцмережах, новинних ресурсах або сайтах про бізнес-діяльність (найм, контракти, тендери). Залежно від цілей обирають різні джерела. Отримана інформація може відкрити шлях до інших видів розвідки, підготовки ресурсів і початкового доступу (фішинг, зовнішні сервіси тощо).',
    'technique.description.T1583.001':
      'Зловмисники можуть отримувати домени для використання під час атаки. Доменні імена — це зрозумілі людині адреси, що вказують на IP-адреси; їх можна купити або інколи отримати безкоштовно. Такі домени застосовують для фішингу, drive-by компрометації та C2. Часто обирають імена, схожі на легітимні — typosquatting, інший TLD, homoglyph-атаки з міжнародними доменами. Також використовують прострочені домени з уже довіреною репутацією, приховують власника через private WHOIS або реєструють домени в скомпрометованих хмарних середовищах.',
    'technique.description.T1566.001':
      'Зловмисники можуть надсилати цільовий фішинг зі шкідливим вкладенням, щоб отримати доступ до систем жертви. Цей варіант покладається на виконання файлу користувачем після відкриття листа. Вкладеннями можуть бути документи Office, виконувані файли, PDF або архіви. Текст листа надає правдоподібну причину відкрити файл і інколи пояснює, як обійти захист або розпакувати архів з паролем. Розширення та іконки часто підміняють, щоб exe виглядав як документ.',
    'technique.description.T1059.001':
      'Зловмисники можуть зловживати командами та скриптами PowerShell для виконання коду. PowerShell — потужне CLI та середовище сценаріїв у Windows. Його використовують для розвідки й запуску коду, зокрема завантаження та виконання файлів з Інтернету з диска або в пам’яті. PowerShell можна викликати й без powershell.exe — через .NET-інтерфейси до бібліотеки автоматизації.',
    'technique.description.T1547.001':
      'Зловмисники можуть закріпитися в системі, додавши програму в папку автозапуску або через ключ Run у реєстрі. Запис у Run/RunOnce або Startup запускає програму під час входу користувача з його правами. Типові шляхи — HKCU/HKLM Run і RunOnce, а також системні й персональні папки Startup. Також використовують RunServices, Policies\\Explorer\\Run, BootExecute та інші ключі, щоб пережити перезавантаження; записи можуть маскувати під легітимне ПЗ.',
    'technique.description.T1087.002':
      'Зловмисники можуть отримати перелік доменних облікових записів і груп. Це допомагає обрати цілі для credential access, lateral movement або підвищення привілеїв. У списках часто є користувачі, service accounts і групи з підвищеними правами. Service accounts мають передбачувані імена та слабші політики паролів.',
    'technique.description.T1110.003':
      'Зловмисники можуть застосовувати один або кілька поширених паролів до багатьох акаунтів, щоб уникнути lockout. Password spraying — спочатку багато акаунтів з одним паролем, потім наступний пароль, часто з паузами між спробами.',
    'technique.description.T1566.002':
      'Зловмисники надсилають цільовий фішинг зі шкідливим посиланням, щоб змусити жертву ввести облікові дані або завантажити malware. Посилання ведуть на fake login, OAuth або staged payload. На відміну від вкладень, тут ключове — клік по URL.',
    'technique.description.T1021.001':
      'Зловмисники можуть використовувати RDP для lateral movement у мережі. RDP часто застосовують адміністратори легітимно; зловмисники використовують викрадені creds або pass-the-hash для jump host, серверів чи робочих станцій.',
    'technique.description.T1059.003':
      'Зловмисники зловживають Windows Command Shell (cmd.exe) для виконання команд. Через cmd можна завантажувати файли (certutil, bitsadmin), запускати скрипти або інші інструменти. У захищених мережах cmd інколи менш моніториться, ніж PowerShell.',
  },
} as const;
