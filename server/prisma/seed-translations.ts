import { PrismaClient } from '@prisma/client';
import { MITRE_TECHNIQUE_DESCRIPTIONS } from './mitre-technique-descriptions.ts';
import { MITRE_TECHNIQUE_NAMES } from './mitre-technique-names.ts';

const prisma = new PrismaClient();

const translations: Record<string, Record<string, Record<string, string>>> = {
  en: {
    common: {
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      unknown: 'Unknown',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      loginSubtitle: 'Sign in',
      registerSubtitle: 'Create an account',
      loading: 'Loading...',
      usernameRequired: 'Username is required',
      errorOccurred: 'An error occurred',
      switchToRegisterPrompt: "Don't have an account?",
      switchToLoginPrompt: 'Already have an account?',
      switchToRegister: "Don't have an account? Register",
      switchToLogin: 'Already have an account? Login',
      acceptAgreementPrefix: 'I agree to the',
      agreementRequired: 'You must accept the User Agreement',
    },
    mitre: {
      'killChain.stage.reconnaissance': 'Reconnaissance',
      'killChain.stage.resource-development': 'Resource Development',
      'killChain.stage.initial-access': 'Initial Access',
      'killChain.stage.execution': 'Execution',
      'killChain.stage.persistence': 'Persistence',
      'killChain.stage.privilege-escalation': 'Privilege Escalation',
      'killChain.stage.defense-evasion': 'Defense Evasion',
      'killChain.stage.credential-access': 'Credential Access',
      'killChain.stage.discovery': 'Discovery',
      'killChain.stage.lateral-movement': 'Lateral Movement',
      'killChain.stage.collection': 'Collection',
      'killChain.stage.command-and-control': 'Command and Control',
      'killChain.stage.exfiltration': 'Exfiltration',
      'killChain.stage.impact': 'Impact',
      'killChain.description.reconnaissance': 'gathers information about the target',
      'killChain.description.resource-development': 'prepares tools and infrastructure',
      'killChain.description.initial-access': 'gains access to the system',
      'killChain.description.execution': 'executes malicious code',
      'killChain.description.persistence': 'maintains access to the system',
      'killChain.description.privilege-escalation': 'obtains elevated privileges',
      'killChain.description.defense-evasion': 'evades security systems',
      'killChain.description.credential-access': 'steals credentials',
      'killChain.description.discovery': 'explores the system',
      'killChain.description.lateral-movement': 'moves through the network',
      'killChain.description.collection': 'collects valuable data',
      'killChain.description.command-and-control': 'establishes command channel',
      'killChain.description.exfiltration': 'transfers data outside',
      'killChain.description.impact': 'harms the system',
      'killChain.fullDescription.reconnaissance':
        'At this stage, the attacker gathers information about the target: open ports, software used, employees, network structure. This is the first step in planning an attack.',
      'killChain.fullDescription.resource-development':
        'The attacker prepares tools for the attack: creates malicious files, registers domains, configures command servers. Everything for the future attack.',
      'killChain.fullDescription.initial-access':
        'The attacker penetrates the system through phishing, vulnerabilities, stolen credentials, or other methods. This is the entry point into a protected environment.',
      'killChain.fullDescription.execution':
        "At this stage, malicious code is launched: commands are executed, scripts are run, exploits are activated. The system begins executing the attacker's commands.",
      'killChain.fullDescription.persistence':
        'The attacker establishes a foothold in the system to maintain access even after a reboot. Auto-start tasks and services are created, registries are modified.',
      'killChain.fullDescription.privilege-escalation':
        'The attacker obtains elevated access rights: from regular user to administrator, from user to root. This expands the attack capabilities.',
      'killChain.fullDescription.defense-evasion':
        'The attacker hides from security systems: disables antivirus, deletes logs, uses legitimate tools, masks activity.',
      'killChain.fullDescription.credential-access':
        'Credential theft: passwords, tokens, access keys. This allows moving through the network under the guise of a legitimate user.',
      'killChain.fullDescription.discovery':
        'System exploration: searching for files, databases, network resources, accounts. Gathering information about structure and content.',
      'killChain.fullDescription.lateral-movement':
        'Network movement: from one computer to another, using stolen credentials or exploits. Expanding the control zone.',
      'killChain.fullDescription.collection':
        'Target data collection: important files, databases, documents, personal information. Preparing data for theft.',
      'killChain.fullDescription.command-and-control':
        "Command channel establishment: communication between the infected system and the attacker's server. Allows remote attack control.",
      'killChain.fullDescription.exfiltration':
        'Transfer of stolen data outside: through the internet, cloud services, USB devices. Data leaves the protected environment.',
      'killChain.fullDescription.impact':
        'System damage: data deletion, file encryption, service shutdown, system corruption. The final stage of the attack.',
      'killChain.goal.reconnaissance': 'learn as much as possible about the target',
      'killChain.goal.resource-development': 'prepare tools for the attack',
      'killChain.goal.initial-access': 'penetrate the system',
      'killChain.goal.execution': 'launch malicious code',
      'killChain.goal.persistence': 'maintain access for a long time',
      'killChain.goal.privilege-escalation': 'obtain administrator rights',
      'killChain.goal.defense-evasion': 'evade protection',
      'killChain.goal.credential-access': 'steal logins and passwords',
      'killChain.goal.discovery': 'study the system structure',
      'killChain.goal.lateral-movement': 'move to other computers',
      'killChain.goal.collection': 'collect important data',
      'killChain.goal.command-and-control': 'establish connection with attacker',
      'killChain.goal.exfiltration': 'transfer data outside',
      'killChain.goal.impact': 'harm the system or data',
      'killChain.result.reconnaissance': 'Target information obtained, vulnerabilities found',
      'killChain.result.resource-development': 'Tools and infrastructure prepared',
      'killChain.result.initial-access': 'System access obtained',
      'killChain.result.execution': 'Malicious code launched',
      'killChain.result.persistence': 'Access maintained even after reboot',
      'killChain.result.privilege-escalation': 'Administrator rights obtained',
      'killChain.result.defense-evasion': 'Security systems bypassed',
      'killChain.result.credential-access': 'Logins and passwords stolen',
      'killChain.result.discovery': 'System structure studied',
      'killChain.result.lateral-movement': 'Access to other systems obtained',
      'killChain.result.collection': 'Important data collected (files, databases)',
      'killChain.result.command-and-control': 'Command channel established',
      'killChain.result.exfiltration': 'Data transferred to attacker',
      'killChain.result.impact': 'System or data damaged',
      'modal.whatIsThis': 'What is this?',
      'modal.platforms': 'Platforms:',
      'modal.positionInKillChain': 'Position in Kill Chain',
      'modal.howItWorks': 'How does it work?',
      'modal.attackGoal': 'Attack Goal',
      'modal.attackResult': 'Attack Result',
      'modal.examples': 'Examples',
      'modal.howToProtect': 'How to protect?',
      'modal.completed': 'Mastered',
      'modal.relatedMissions': 'Related missions',
      'modal.goToMission': 'Go to mission',
      'mitigation.regular-updates': 'Regularly update security systems',
      'mitigation.monitoring': 'Use monitoring and logging',
      'mitigation.least-privilege': 'Apply principle of least privilege',
      'mitigation.mfa': 'Use multi-factor authentication',
      'mitigation.training': 'Train employees',
      'mitigation.segmentation': 'Use network segmentation',
      'mitigation.backup': 'Configure backup',
      'mitigation.description.regular-updates':
        'Installing security updates closes known vulnerabilities. Configure automatic updates for the operating system, antivirus, browsers and other software. This is critical, as most attacks use already known vulnerabilities.',
      'mitigation.description.monitoring':
        'Monitoring and logging systems allow tracking suspicious activity in real-time. Configure centralized logging, analyze logs for anomalies, use SIEM systems for event correlation and early threat detection.',
      'mitigation.description.least-privilege':
        'Users and applications should have only the access rights necessary to perform their tasks. This limits the impact zone when an account or application is compromised.',
      'mitigation.description.mfa':
        'MFA adds an additional layer of protection by requiring confirmation through multiple factors (password + SMS/token). This significantly complicates credential theft and unauthorized access.',
      'mitigation.description.training':
        'Users often become the weak link in security. Regular training on cybersecurity, phishing and safe practices reduces the risk of successful attacks through social engineering.',
      'mitigation.description.segmentation':
        'Dividing the network into segments limits attack spread. Even if an attacker penetrates one segment, they cannot easily access critical systems.',
      'mitigation.description.backup':
        'Regular backups allow quick system recovery after an incident. Store copies separately from main systems, test recovery procedures and use the 3-2-1 rule (3 copies, 2 different media, 1 off-site).',
      'modal.examplesTitle': 'Examples of use in attacks',
      'modal.action': 'Action',
      'modal.result': 'Result',
      'modal.relatedMissionsTitle': 'Game missions where this technique is studied',
      'modal.goToMission': 'Go to mission',
      'modal.dataSources': 'Data sources for detection:',
      'modal.usedOnStage': 'is used on stage',
      'modal.meansAttackerAlready': 'this means that the attacker already',
      'modal.openOnMitre': 'Open on MITRE',
      'modal.copyId': 'Copy technique ID',
      'modal.idCopied': 'Copied!',
      'example.data-from-local-system': 'Data from Local System',
      'example.description.data-from-local-system':
        "The attacker collects data from the victim's local system, including files, configurations, and other sensitive information.",
      'example.defaultDescription': 'This is an example of how {{example}} can be used in attacks.',
      ...MITRE_TECHNIQUE_NAMES.en,
      ...MITRE_TECHNIQUE_DESCRIPTIONS.en,
      'tactic.Reconnaissance': 'Reconnaissance',
      'tactic.Resource Development': 'Resource Development',
      'tactic.Initial Access': 'Initial Access',
      'tactic.Execution': 'Execution',
      'tactic.Persistence': 'Persistence',
      'tactic.Privilege Escalation': 'Privilege Escalation',
      'tactic.Defense Evasion': 'Defense Evasion',
      'tactic.Credential Access': 'Credential Access',
      'tactic.Discovery': 'Discovery',
      'tactic.Lateral Movement': 'Lateral Movement',
      'tactic.Collection': 'Collection',
      'tactic.Command and Control': 'Command and Control',
      'tactic.Exfiltration': 'Exfiltration',
      'tactic.Impact': 'Impact',
      'tactic.explanation.Reconnaissance':
        'This is the reconnaissance stage when the attacker gathers information about the target before the attack.',
      'tactic.explanation.Resource Development':
        'The attacker creates or obtains resources necessary for the attack (tools, infrastructure).',
      'tactic.explanation.Initial Access':
        'The attacker gains initial access to the system or network.',
      'tactic.explanation.Execution':
        'The attacker executes malicious code or commands on the target system.',
      'tactic.explanation.Persistence':
        'The attacker maintains access to the system even after reboot or session closure.',
      'tactic.explanation.Privilege Escalation':
        'The attacker obtains higher privileges in the system (e.g., administrator rights).',
      'tactic.explanation.Defense Evasion':
        'The attacker tries to avoid detection by security systems.',
      'tactic.explanation.Credential Access':
        'The attacker steals credentials (logins, passwords) for system access.',
      'tactic.explanation.Discovery':
        'The attacker explores the system to understand its structure and find vulnerabilities.',
      'tactic.explanation.Lateral Movement':
        'The attacker moves through the network, gaining access to other systems.',
      'tactic.explanation.Collection': 'The attacker collects data of interest (files, databases).',
      'tactic.explanation.Command and Control':
        'The attacker establishes a communication channel with the infected system for control.',
      'tactic.explanation.Exfiltration':
        'The attacker transfers stolen data beyond the target network.',
      'tactic.explanation.Impact':
        'The attacker damages the system (data deletion, encryption, service disruption).',
      'tactic.explanation.default':
        'This technique relates to the {{tactic}} tactic within the MITRE ATT&CK Framework.',
      'killChain.defaultDescription': 'performs actions',
      'killChain.defaultFullDescription': 'Attack stage in Kill Chain.',
      'killChain.defaultGoal': 'execute attack',
      'killChain.defaultResult': 'Attack completed successfully',
      'mitigation.defaultDescription':
        'This recommendation will help protect your system from cyberattacks. Follow security best practices for your infrastructure.',
    },
    tasks: {
      success: 'SUCCESS!',
      successTitle: 'SUCCESS',
      successBody: 'Correct! The task was already completed earlier, points were credited.',
      failure: 'FAILURE:',
      failureTitle: 'FAILURE',
      error: 'ERROR:',
      taskCompleted: 'Task completed successfully!',
      wrongAnswer: 'Wrong answer',
      errorOccurred: 'An error occurred',
      nextLevel: 'Go to next task',
      allCompleted: '🎉 All mission tasks completed!',
      execute: 'EXECUTE',
      executing: 'EXECUTING...',
      enterRegexPattern: 'ENTER REGEX PATTERN:',
      enterRegexPatternPlaceholder: 'Enter regex pattern',
      enterCode: 'ENTER CODE:',
      hints: 'Hints:',
      showHints: 'Show hints',
      hideHints: 'Hide hints',
      phishingConstructorTitle: 'Phishing email',
      sentenceConstructorHint: 'Tap phrases to build the email. Click a slot to remove a word.',
      emailTo: 'To:',
      emailSubject: 'Subject:',
      emailBody: 'Body:',
      emailAttachments: 'Attachments:',
      emailSubjectPlaceholder: 'Enter email subject',
      emailBodyPlaceholder: 'Enter email body',
      sendEmail: 'SEND EMAIL',
      sendingEmail: 'SENDING...',
    },
    ui: {
      selectMission: 'Select campaign to start',
      workArea: 'Work Area',
      unknownTask: 'Unknown task type',
      expandMenu: 'Expand menu',
      collapseMenu: 'Collapse menu',
      collapse: 'Collapse',
      stealth: 'STEALTH',
      rank: 'RANK',
      xp: 'XP',
      'rank.Script Kiddie': 'Script Kiddie',
      'rank.Novice Hacker': 'Novice Hacker',
      'rank.Intermediate Hacker': 'Intermediate Hacker',
      'rank.Advanced Hacker': 'Advanced Hacker',
      'rank.Elite Hacker': 'Elite Hacker',
      'rank.description.Script Kiddie':
        'Starting point. In security culture, a "script kiddie" uses ready-made tools without deep understanding. In CyberTactics this marks the beginning of your path in ethical hacking simulations.',
      'rank.description.Novice Hacker':
        'You grasp reconnaissance basics, MITRE techniques, and mission flow. A junior level in red-team fundamentals.',
      'rank.description.Intermediate Hacker':
        'You handle multi-step attack chains, OPSEC awareness, and combining techniques across missions.',
      'rank.description.Advanced Hacker':
        'Strong tactical thinking, stealth management, and complex scenario-based challenges.',
      'rank.description.Elite Hacker':
        'Mastery level — deep MITRE coverage, optimal mission execution, and top-tier operator skill.',
      ranks: 'Career Ranks',
      ranksIntro:
        'Ranks reflect your XP from missions. This is a gamified learning ladder — from Script Kiddie to Elite Hacker — inspired by real offensive security culture, not an official certification.',
      ranksCurrent: 'Your rank',
      ranksXpRange: '{{from}}–{{to}} XP',
      ranksXpFrom: '{{xp}}+ XP',
      missions: 'Missions',
      skillMatrix: 'Skill Matrix',
      faq: 'FAQ',
      community: 'Community',
      support: 'Support',
      supportSubjectPlaceholder: '3–200 characters',
      supportMessagePlaceholder: '10–5000 characters',
      adminTickets: 'Support tickets',
      adminTicketsClose: 'Close ticket',
      adminTicketsCloseTitle: 'Close ticket?',
      adminTicketsCloseMessage: 'The ticket will be closed and no further replies can be sent.',
      adminTicketsCloseReasonLabel: 'Reason',
      adminTicketsCloseReasonCustomLabel: 'Custom reason',
      adminTicketsCloseReasonCustomPlaceholder: '3–500 characters',
      adminTicketsCloseSubmit: 'Close ticket',
      adminTicketsCloseClosing: 'Closing...',
      adminTicketsCloseError: 'Failed to close ticket.',
      adminTicketsClosedAt: 'Closed: {{date}}',
      'supportCloseReason.ANSWERED': 'Answer provided',
      'supportCloseReason.DECLINED': 'Request does not meet requirements',
      'supportCloseReason.CUSTOM': 'Custom reason',
      supportClosedReasonLabel: 'Closure reason',
      notificationsOpen: 'Open notifications',
      notificationsTitle: 'Notifications',
      notificationsMarkAllRead: 'Mark all read',
      notificationsEmpty: 'No notifications yet.',
      'notification.supportReply.title': 'Support reply',
      'notification.supportReply.body': 'New reply on: {{subject}}',
      'notification.rankUp.title': 'Rank up!',
      'notification.rankUp.body': 'You reached the rank: {{rank}}',
      'notification.news.title': 'News',
      'notification.news.body': 'New article: {{title}}',
      footerCopyright: '© {{year}} CyberTactics. All rights reserved.',
      news: 'News',
      newsEmpty: 'No news yet.',
      newsLoadError: 'Failed to load news.',
      newsPermalink: 'Copy link',
      newsPermalinkCopied: 'Link copied',
      newsPermalinkCopyError: 'Failed to copy link.',
      adminNews: 'News management',
      adminNewsCreate: 'New article',
      adminNewsEdit: 'Edit article',
      adminNewsList: 'All articles',
      adminNewsEmpty: 'No articles yet.',
      adminNewsPublished: 'Published',
      adminNewsDraft: 'Draft',
      adminNewsTitleUk: 'Title (UK)',
      adminNewsTitleEn: 'Title (EN)',
      adminNewsBodyUk: 'Text (UK)',
      adminNewsBodyEn: 'Text (EN)',
      adminNewsPublish: 'Publish',
      adminNewsLoadError: 'Failed to load news.',
      adminNewsSaveError: 'Failed to save news.',
      adminNewsDeleteError: 'Failed to delete news.',
      adminNewsDeleteTitle: 'Delete article?',
      adminNewsDeleteMessage: 'This article will be permanently removed.',
      leaderboard: 'Leaderboard',
      leaderboardPosition: '#',
      leaderboardPlayer: 'Player',
      leaderboardLevels: 'Levels',
      leaderboardTechniques: 'MITRE',
      leaderboardYou: 'you',
      leaderboardEmpty: 'No players on the leaderboard yet.',
      leaderboardLoadError: 'Failed to load leaderboard.',
      loading: 'Loading...',
      settings: 'Settings',
      profile: 'Profile',
      inDevelopment: 'Coming soon...',
      contextPanel: 'Context Panel',
      currentMitreTechnique: 'Current MITRE Technique:',
      taskCompleted: 'Task completed',
      taskStatusCompleted: 'Status: Task completed.',
      taskStatusNotCompleted: 'Status: Task not completed.',
      handlerTaskCompleted:
        'Congratulations, task completed! You successfully submitted the answer\n{{answer}}',
      levelCompletedTitle: 'Task completed',
      levelCompletedHint: 'You can review the dialogue on the left or try the assignment again.',
      tryAgain: 'Try again',
      nextAssignment: 'Next task',
      allMissionTasksCompleted: 'All mission tasks completed!',
      missionCompletedBadge: 'Mission completed',
      missionInProgressBadge: 'Mission in progress',
      backToMissions: 'Back to missions list',
      stealthDepletedTitle: 'Stealth depleted',
      stealthDepletedMessage:
        'You cannot submit answers while stealth is at 0%. Choose a recovery option:',
      stealthManageTitle: 'Stealth',
      stealthManageMessage: 'Current stealth: {{stealth}}%. Choose a recovery option:',
      stealthOpenModal: 'Open stealth recovery options',
      stealthBuyMasking: 'Buy {{amount}}% masking — restore stealth',
      stealthMaskingUnavailable:
        'Masking (+{{amount}}%) would exceed 100% (current: {{stealth}}%).',
      stealthUpgradePlan: 'Upgrade to premium',
      stealthPassiveRecoveryIn: '+{{amount}}% stealth will recover automatically in {{time}}.',
      stealthAtMax: 'Stealth is already at 100%.',
      stealthPremiumMock: 'Premium plan checkout is not connected yet.',
      yourPreviousCorrectAnswer: 'Your previous correct answer:',
      correctAnswerForTraining: 'Correct answer (for training):',
      handler: 'HANDLER',
      system: '[System]',
      handlerPrefix: '[HANDLER]',
      hintPrefix: '[HINT]',
      noDialogueAvailable: 'No dialogue available',
      backToAssignments: 'Back to assignments',
      backToMissions: 'Back to missions',
      assignmentsNotFound: 'Assignments not found',
      loadingMissions: 'Loading missions...',
      loadingAssignments: 'Loading assignments...',
      loadingAssignment: 'Loading assignment...',
      noMissionsAvailable: 'No missions available',
      missionAssignmentsSubtitle: 'Mission assignments ({{count}})',
      assignmentNo: 'Assignment {{n}}',
      assignmentStatusCompleted: 'Completed',
      assignmentStatusLocked: 'Locked',
      assignmentStatusIncomplete: 'Incomplete',
      assignmentPanelEmpty: 'Select an assignment on the left',
      assignmentPanelEmptyHint: 'Details, progress and MITRE context will appear here.',
      assignmentPanelLearnTitle: 'What you will learn',
      assignmentStart: 'Start assignment',
      assignmentCompleted: 'Completed',
      assignmentLocked: 'Locked',
      taskTypeCaption: 'Task type:',
      taskTypeCodeEditor: 'Code editor',
      taskTypeTacticalChoice: 'Tactical choice',
      taskTypePhishingConstructor: 'Phishing constructor',
      taskTypeSentenceConstructor: 'Sentence constructor',
      mitreTechniques: 'MITRE ATT&CK Techniques:',
      more: 'more',
      techniques: 'techniques',
      'difficulty.beginner': 'beginner',
      'difficulty.intermediate': 'intermediate',
      'difficulty.advanced': 'advanced',
      'specialization.OSINT Specialist': 'OSINT Specialist',
      'specialization.Penetration Tester': 'Penetration Tester',
      'specialization.Malware Analyst': 'Malware Analyst',
      'specialization.Network Security Expert': 'Network Security Expert',
    },
    skillMatrix: {
      title: 'Skill Matrix (MITRE ATT&CK)',
      progress: 'Progress',
      techniques: 'techniques',
      techniquesShort: 'techniques',
      searchPlaceholder: 'Search by ID, name, description or tactic...',
      filterAll: 'All techniques',
      filterCompleted: 'Only mastered',
      filterIncomplete: 'Only unmastered',
      expandAll: 'Expand all',
      collapseAll: 'Collapse all',
      loading: 'Loading...',
      completed: 'Mastered:',
      notFound: 'Techniques not found',
      tryAnotherQuery: 'Try changing the search query',
      notLoaded: 'MITRE ATT&CK techniques are not loaded yet.',
      syncRequired: 'Perform synchronization through the admin panel.',
    },
    profile: {
      title: 'Profile',
      account: 'Account',
      username: 'Username',
      email: 'Email',
      changePhoto: 'Change photo',
      cropTitle: 'Adjust photo',
      zoom: 'Zoom',
      cropHint: 'Drag the photo to reposition. Use the slider to zoom.',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      logout: 'Log out',
      invalidFileType: 'Only JPG, PNG or WEBP are allowed.',
      fileTooLarge: 'File is too large (max 5 MB).',
      uploadFailed: 'Failed to save photo.',
    },
    faq: {
      title: 'FAQ',
      intro: 'Answers about mission types and how to use CyberTactics.',
      'section.missionTypes': 'Mission task types',
      'section.platform': 'Using the platform',
      'items.codeEditor.question': 'What is a Code editor task?',
      'items.codeEditor.answer':
        'You write code or a regex pattern in the work area. For example, search HTML for hidden data or compose a PowerShell command. Click Execute to check your answer. Wrong attempts reduce stealth.',
      'items.tacticalChoice.question': 'What is a Tactical choice task?',
      'items.tacticalChoice.answer':
        'You pick one option from a list — for example, the most convincing phishing domain or registry key for persistence. Read each option carefully and submit your choice.',
      'items.phishingConstructor.question': 'What is a Phishing constructor task?',
      'items.phishingConstructor.answer':
        'You build a phishing email: subject, body, and sometimes attachments. The goal is to bypass filters and trick the target into running a payload — without forbidden file types like .exe.',
      'items.sentenceConstructor.question': 'What is a Sentence constructor task?',
      'items.sentenceConstructor.answer':
        'You assemble phrases or email parts from word blocks — like crafting convincing social-engineering text step by step. Complete all required fields before sending.',
      'items.whatIs.question': 'What is CyberTactics?',
      'items.whatIs.answer':
        'An educational platform for learning offensive security basics through mission simulations. Tasks map to MITRE ATT&CK techniques. Everything runs in a safe sandbox — no real attacks.',
      'items.howMissions.question': 'How do I start a mission?',
      'items.howMissions.answer':
        'Open Missions, pick a campaign, then choose an assignment. Click the card to see what you will learn on the right; use the arrow or Start assignment to enter the task. Complete assignments in order — the next unlocks after the previous one.',
      'items.stealth.question': 'What is Stealth?',
      'items.stealth.answer':
        'Stealth is your operational security meter. Wrong answers and noisy actions lower it. At 0% you cannot submit until you recover. Click the STEALTH bar in the header to open recovery options (masking, wait, premium).',
      'items.xpRanks.question': 'What are XP and ranks?',
      'items.xpRanks.answer':
        'You earn XP for completing tasks. XP raises your rank from Script Kiddie to Elite Hacker. Click your rank in the header to see the full progression ladder.',
      'items.skillMatrix.question': 'What is the Skill Matrix?',
      'items.skillMatrix.answer':
        'A map of MITRE ATT&CK techniques you encounter in missions. Expand tactics, click a technique for details, kill chain context, and related missions. Completed techniques are marked in green.',
      'items.hints.question': 'How do hints work?',
      'items.hints.answer':
        'In the work area, use Show hint at the bottom. Hints guide you without giving the full answer. Use them when stuck — they are part of the learning flow.',
      'items.leaderboard.question': 'What is the Leaderboard?',
      'items.leaderboard.answer':
        'Compare progress with other players: XP, completed levels, and MITRE techniques mastered. Your row is highlighted.',
      'items.language.question': 'How do I change the language?',
      'items.language.answer':
        'Use the language switcher in the top bar (UA / EN). Translations load without refreshing the page.',
    },
    community: {
      title: 'Community',
      intro: 'Discuss missions, MITRE techniques, and platform tips with other operators.',
      topicsHeading: 'Topics',
      discussionHeading: 'Discussion',
      selectTopic: 'Select a topic on the left to read the thread.',
      noTopics: 'No topics in this category yet.',
      originalPost: 'Original post',
      readOnlyNotice:
        'This forum is read-only for now. New topics and replies will be available in a future update.',
      metaReplies: '{{count}} replies',
      replyCount: '{{count}} replies',
      'categories.all': 'All',
      'categories.general': 'General',
      'categories.missions': 'Missions',
      'categories.mitre': 'MITRE',
      'categories.tips': 'Tips & tricks',
      'topics.welcome.title': 'Welcome to the CyberTactics community',
      'topics.welcome.excerpt':
        'Introduce yourself and share what you want to learn first — recon, phishing, or lateral movement.',
      'topics.welcome.lastActivity': 'Last activity: 2 days ago',
      'topics.welcome.posts.op.author': 'Handler_Ops',
      'topics.welcome.posts.op.time': 'Jan 12 · 09:40',
      'topics.welcome.posts.op.body':
        'Welcome aboard. This space is for mission debriefs, MITRE mapping questions, and sharing what worked in the sim — without posting real target data or exploit code.',
      'topics.welcome.posts.r1.author': 'NovaFinLearner',
      'topics.welcome.posts.r1.time': 'Jan 12 · 11:05',
      'topics.welcome.posts.r1.body':
        'Starting with Operation Ghost. Any advice on the regex recon task without overfitting the pattern?',
      'topics.welcome.posts.r2.author': 'BlueTeamCurious',
      'topics.welcome.posts.r2.time': 'Jan 13 · 08:20',
      'topics.welcome.posts.r2.body':
        'Same here. Skill Matrix helped me see which tactics I had already touched in missions.',
      'topics.ghostStart.title': 'Operation Ghost: best order for beginners?',
      'topics.ghostStart.excerpt':
        'Should you finish all recon before phishing, or replay failed tasks for XP?',
      'topics.ghostStart.lastActivity': 'Last activity: 5 hours ago',
      'topics.ghostStart.posts.op.author': 'ApexRookie',
      'topics.ghostStart.posts.op.time': 'Feb 3 · 14:10',
      'topics.ghostStart.posts.op.body':
        'Ghost feels linear — is there value in repeating the PowerShell task to practice IWR syntax, or push straight to persistence?',
      'topics.ghostStart.posts.r1.author': 'GhostClear',
      'topics.ghostStart.posts.r1.time': 'Feb 3 · 15:02',
      'topics.ghostStart.posts.r1.body':
        'Finish the chain once for unlocks. Replay only if you missed stealth on execution (-5) and want a clean run.',
      'topics.ghostStart.posts.r2.author': 'Handler_Ops',
      'topics.ghostStart.posts.r2.time': 'Feb 3 · 16:44',
      'topics.ghostStart.posts.r2.body':
        'Domain choice (task 2) sets the story for phishing — read filter feedback on wrong answers, it mirrors real blue-team rules.',
      'topics.ironSignal.title': 'Iron Signal: spray vs spearphish — where people get stuck',
      'topics.ironSignal.excerpt':
        'Password spraying tactics and the free-text spearphish task — common pitfalls.',
      'topics.ironSignal.lastActivity': 'Last activity: 1 hour ago',
      'topics.ironSignal.posts.op.author': 'SvcSprayFan',
      'topics.ironSignal.posts.op.time': 'Mar 8 · 10:00',
      'topics.ironSignal.posts.op.body':
        'Spray task is obvious once you think lockout policy. Spearphish is harder — you need SSO keywords in subject/body, not a magic exact phrase.',
      'topics.ironSignal.posts.r1.author': 'AnalystRoleplay',
      'topics.ironSignal.posts.r1.time': 'Mar 8 · 10:35',
      'topics.ironSignal.posts.r1.body':
        'Use hints for keyword groups. Avoid .exe attachments — filters block them even if the text is perfect.',
      'topics.ironSignal.posts.r2.author': 'NovaFinLearner',
      'topics.ironSignal.posts.r2.time': 'Mar 8 · 11:12',
      'topics.ironSignal.posts.r2.body':
        'LDAP regex: target service accounts in OU=ServiceAccounts, not user mail fields.',
      'topics.killChain.title': 'Kill chain labels vs MITRE tactics',
      'topics.killChain.excerpt':
        'Why mission briefing says "Phase 2" but the chip shows Credential Access or Initial Access.',
      'topics.killChain.lastActivity': 'Last activity: 3 days ago',
      'topics.killChain.posts.op.author': 'FrameworkNerd',
      'topics.killChain.posts.op.time': 'Jan 28 · 18:30',
      'topics.killChain.posts.op.body':
        'Campaign narrative uses Cyber Kill Chain phases; each task still maps to a specific ATT&CK technique. Both are intentional — story flow vs taxonomy.',
      'topics.killChain.posts.r1.author': 'SkillMatrixUser',
      'topics.killChain.posts.r1.time': 'Jan 29 · 09:15',
      'topics.killChain.posts.r1.body':
        'Open the technique modal from assignments — kill chain strip + tactic explanation clears most confusion.',
      'topics.stealthTips.title': 'Stealth: when to wait vs buy masking',
      'topics.stealthTips.excerpt':
        'Recovery options in the header bar — planning wrong answers in noisy tasks.',
      'topics.stealthTips.lastActivity': 'Last activity: 6 hours ago',
      'topics.stealthTips.posts.op.author': 'QuietOperator',
      'topics.stealthTips.posts.op.time': 'Feb 20 · 07:50',
      'topics.stealthTips.posts.op.body':
        'Tasks with negative stealth impact (PowerShell, certutil, spearphish) — read the stat card before submitting. If you are at 15%, one fail can block submissions.',
      'topics.stealthTips.posts.r1.author': 'MaskingBuyer',
      'topics.stealthTips.posts.r1.time': 'Feb 20 · 08:30',
      'topics.stealthTips.posts.r1.body':
        'Masking jumps you to 50% floor — good before a mission finale. Passive regen is slow but free.',
      'topics.stealthTips.posts.r2.author': 'Handler_Ops',
      'topics.stealthTips.posts.r2.time': 'Feb 20 · 09:01',
      'topics.stealthTips.posts.r2.body':
        'Hints first, brute force submits last — each wrong answer costs stealth on many tasks.',
      'topics.regexRecon.title': 'Regex recon: email vs service account patterns',
      'topics.regexRecon.excerpt':
        'Ghost email obfuscation and Iron Signal LDAP — what validators actually check.',
      'topics.regexRecon.lastActivity': 'Last activity: 12 hours ago',
      'topics.regexRecon.posts.op.author': 'RegexRookie',
      'topics.regexRecon.posts.op.time': 'Mar 1 · 13:00',
      'topics.regexRecon.posts.op.body':
        'Validator runs your pattern against a test string, not always the whole snippet. Ghost wants an email shape; Iron Signal wants the service account name pattern.',
      'topics.regexRecon.posts.r1.author': 'SvcSprayFan',
      'topics.regexRecon.posts.r1.time': 'Mar 1 · 14:22',
      'topics.regexRecon.posts.r1.body':
        'Start simple: svc_backup prefix + character class. Expand only if hints say the account name varies.',
    },
    agreement: {
      footerLink: 'User Agreement',
      title: 'User Agreement',
      intro:
        'Welcome to CyberTactics. By using this service, you confirm that you have read and agree to the terms below.',
      'section1.title': '1. Purpose of the Platform',
      'section1.body':
        'CyberTactics is an educational interactive platform designed to lower the barrier to entry in cybersecurity. The service helps users learn—in a safe environment—the fundamentals of information security, attack models (including MITRE ATT&CK), and threat response practices.',
      'section2.title': '2. Educational Nature and Simulation',
      'section2.body':
        'All scenarios, missions, and tasks on the platform are for educational purposes only. CyberTactics does not attack real systems, networks, or servers and does not provide tools for use outside the learning context. Any actions within the platform are simulations and do not cause real harm to third-party infrastructure.',
      'section3.title': '3. Lawful Use of Knowledge',
      'section3.body':
        "Knowledge gained on the platform is intended solely for lawful activities: education, certification, and protecting your own or your organization's infrastructure in accordance with applicable law and professional ethics. Using this knowledge for unauthorized access, data damage, extortion, phishing, malware distribution, or other unlawful acts is strictly prohibited.",
      'section4.title': '4. User Responsibility',
      'section4.body':
        'You are fully responsible for your actions outside the platform. Violations of applicable law regarding cybercrime—including unauthorized interference with computer systems, data theft, and fraud in electronic communications—may result in civil, administrative, and criminal liability as provided by law.',
      'section5.title': '5. Acceptance of Terms',
      'section5.body':
        'By continuing to use the platform, you confirm that you understand the educational nature of the simulations and agree not to use the knowledge gained for unlawful purposes.',
      back: 'Back',
    },
    missions: {
      'operation_ghost.name': 'Operation Ghost',
      'operation_ghost.description':
        'Simulation of an attack on Apex Dynamics corporation. Complete all stages of Cyber Kill Chain from reconnaissance to persistence installation.',
      'operation_ghost.killChain.title': 'Cyber Kill Chain',
      'operation_ghost.killChain.intro': 'Mission tasks follow the attack stages in order:',
      'operation_ghost.killChain.step1': 'Reconnaissance — find the admin email (task 1)',
      'operation_ghost.killChain.step2': 'Resource Development — choose a phishing domain (task 2)',
      'operation_ghost.killChain.step3': 'Initial Access — craft a phishing email (task 3)',
      'operation_ghost.killChain.step4': 'Execution — run a PowerShell payload (task 4)',
      'operation_ghost.killChain.step5': 'Persistence — registry autostart (task 5)',
      'operation_ghost.killChain.expand': 'Show Cyber Kill Chain',
      'operation_ghost.killChain.collapse': 'Hide Cyber Kill Chain',
      'operation_iron_signal.name': 'Operation Iron Signal',
      'operation_iron_signal.description':
        'Penetrate NovaFin Insurance: from AD account discovery through password spraying, spearphishing links, RDP lateral movement, and cmd staging.',
      'operation_iron_signal.killChain.title': 'Attack progression',
      'operation_iron_signal.killChain.intro':
        'Intermediate mission — post-perimeter tactics in order:',
      'operation_iron_signal.killChain.step1':
        'Discovery — find service account in AD dump (task 1)',
      'operation_iron_signal.killChain.step2':
        'Credential Access — password spray strategy (task 2)',
      'operation_iron_signal.killChain.step3': 'Initial Access — spearphishing link email (task 3)',
      'operation_iron_signal.killChain.step4': 'Lateral Movement — RDP via jump host (task 4)',
      'operation_iron_signal.killChain.step5': 'Execution — certutil staging download (task 5)',
      'operation_iron_signal.killChain.expand': 'Show attack progression',
      'operation_iron_signal.killChain.collapse': 'Hide attack progression',
    },
    levels: {
      'ghost_recon_01.title': 'Search Open Websites',
      'ghost_resource_02.title': 'Domain Typosquatting',
      'ghost_initial_03.title': 'Phishing Email Construction',
      'ghost_execution_04.title': 'PowerShell Payload Execution',
      'ghost_persistence_05.title': 'Registry Persistence',
      'iron_discovery_01.title': 'Active Directory Account Discovery',
      'iron_spray_02.title': 'Password Spraying Strategy',
      'iron_spearphish_03.title': 'Spearphishing Link',
      'iron_lateral_04.title': 'Remote Desktop Lateral Movement',
      'iron_staging_05.title': 'Windows Command Shell Staging',
    },
    dialogues: {
      "[System]: Mission 'Operation Ghost' started.": "Mission 'Operation Ghost' started.",
      'Target: Apex Dynamics.': 'Target: Apex Dynamics.',
      'We need their admin email. Check this HTML snippet from their dev server. Stay quiet.':
        'We need their admin email. Check this HTML snippet from their dev server. Stay quiet.',
      '[System]: Phase 1 - Reconnaissance completed. Email secured.':
        'Phase 1 - Reconnaissance completed. Email secured.',
      'Good. Now we need a domain for phishing. Choose wisely - it should look legitimate but bypass their filters.':
        'Good. Now we need a domain for phishing. Choose wisely - it should look legitimate but bypass their filters.',
      '[System]: Phase 2 - Initial Access. Target email secured.':
        'Phase 2 - Initial Access. Target email secured.',
      'Okay, craft a phishing email to admin_backup. Their filters are strict. No .exe files. You need to trick them into running a payload.':
        'Okay, craft a phishing email to admin_backup. Their filters are strict. No .exe files. You need to trick them into running a payload.',
      '[System]: Phase 3 - Execution. Target opened the attachment.':
        'Phase 3 - Execution. Target opened the attachment.',
      'Perfect. Now write a PowerShell command to download our payload. Use Invoke-WebRequest. Keep it quiet - no verbose output.':
        'Perfect. Now write a PowerShell command to download our payload. Use Invoke-WebRequest. Keep it quiet - no verbose output.',
      '[System]: Phase 4 - Persistence. Payload executed.':
        'Phase 4 - Persistence. Payload executed.',
      'Last step. Choose the registry key for autorun. We need it to survive reboots but not trigger UAC.':
        'Last step. Choose the registry key for autorun. We need it to survive reboots but not trigger UAC.',
      "[System]: Mission 'Operation Iron Signal' started.":
        "Mission 'Operation Iron Signal' started.",
      'Target: NovaFin Insurance internal network.': 'Target: NovaFin Insurance internal network.',
      'We dumped a slice of LDAP from their DC. Find the service account we can spray — not a regular user mailbox.':
        'We dumped a slice of LDAP from their DC. Find the service account we can spray — not a regular user mailbox.',
      '[System]: Phase 1 - Discovery complete. Service account identified.':
        'Phase 1 - Discovery complete. Service account identified.',
      'NovaFin locks accounts after five failures. Pick a spray plan that avoids lockout and stays quiet.':
        'NovaFin locks accounts after five failures. Pick a spray plan that avoids lockout and stays quiet.',
      '[System]: Phase 2 - Credential Access. Valid creds for finance analyst obtained.':
        'Phase 2 - Credential Access. Valid creds for finance analyst obtained.',
      'Compose a spearphish to analyst@novafin.local. Drive them to our fake SSO page — no executables in attachments.':
        'Compose a spearphish to analyst@novafin.local. Drive them to our fake SSO page — no executables in attachments.',
      '[System]: Phase 3 - Initial Access. Analyst session captured.':
        'Phase 3 - Initial Access. Analyst session captured.',
      'Move to the finance server. Their bastion is monitored — choose the path that blends in.':
        'Move to the finance server. Their bastion is monitored — choose the path that blends in.',
      '[System]: Phase 4 - Lateral Movement. FIN-SRV01 access confirmed.':
        'Phase 4 - Lateral Movement. FIN-SRV01 access confirmed.',
      'Stage the payload on disk using certutil — PowerShell is heavily logged here. One quiet command.':
        'Stage the payload on disk using certutil — PowerShell is heavily logged here. One quiet command.',
    },
  },
  uk: {
    common: {
      close: 'Закрити',
      loading: 'Завантаження...',
      error: 'Помилка',
      success: 'Успіх',
      unknown: 'Невідомо',
    },
    auth: {
      login: 'Вхід',
      register: 'Реєстрація',
      email: 'Електронна пошта',
      password: 'Пароль',
      username: "Ім'я користувача",
      loginSubtitle: 'Увійти',
      registerSubtitle: 'Створіть обліковий запис',
      loading: 'Завантаження...',
      usernameRequired: "Ім'я користувача обов'язкове",
      errorOccurred: 'Сталася помилка',
      switchToRegisterPrompt: 'Немає облікового запису?',
      switchToLoginPrompt: 'Вже є обліковий запис?',
      switchToRegister: 'Немає облікового запису? Зареєструватися',
      switchToLogin: 'Вже є обліковий запис? Увійти',
      acceptAgreementPrefix: 'Я погоджуюся з',
      agreementRequired: 'Потрібно прийняти Угоду користувача',
    },
    mitre: {
      'killChain.stage.reconnaissance': 'Розвідка',
      'killChain.stage.resource-development': 'Підготовка',
      'killChain.stage.initial-access': 'Доступ',
      'killChain.stage.execution': 'Виконання',
      'killChain.stage.persistence': 'Стійкість',
      'killChain.stage.privilege-escalation': 'Підвищення прав',
      'killChain.stage.defense-evasion': 'Обхід захисту',
      'killChain.stage.credential-access': 'Крадіжка даних',
      'killChain.stage.discovery': 'Дослідження',
      'killChain.stage.lateral-movement': 'Переміщення',
      'killChain.stage.collection': 'Збір даних',
      'killChain.stage.command-and-control': 'Управління',
      'killChain.stage.exfiltration': 'Викрадення',
      'killChain.stage.impact': 'Шкода',
      'killChain.description.reconnaissance': 'збирає інформацію про ціль',
      'killChain.description.resource-development': 'готує інструменти та інфраструктуру',
      'killChain.description.initial-access': 'отримує доступ до системи',
      'killChain.description.execution': 'виконує шкідливий код',
      'killChain.description.persistence': 'зберігає доступ до системи',
      'killChain.description.privilege-escalation': 'отримує підвищені привілеї',
      'killChain.description.defense-evasion': 'ховається від систем захисту',
      'killChain.description.credential-access': 'краде облікові дані',
      'killChain.description.discovery': 'досліджує систему',
      'killChain.description.lateral-movement': 'переміщується по мережі',
      'killChain.description.collection': 'збирає цінні дані',
      'killChain.description.command-and-control': 'встановлює канал управління',
      'killChain.description.exfiltration': 'передає дані назовні',
      'killChain.description.impact': 'завдає шкоди системі',
      'killChain.fullDescription.reconnaissance':
        'На цьому етапі зловмисник збирає інформацію про ціль: відкриті порти, використовуване ПЗ, співробітників, структуру мережі. Це перший крок для планування атаки.',
      'killChain.fullDescription.resource-development':
        'Зловмисник готує інструменти для атаки: створює шкідливі файли, реєструє домени, налаштовує сервери управління. Все для майбутньої атаки.',
      'killChain.fullDescription.initial-access':
        'Зловмисник проникає в систему через фішинг, вразливості, викрадені облікові дані або інші методи. Це точка входу в захищене середовище.',
      'killChain.fullDescription.execution':
        'На цьому етапі запускається шкідливий код: виконуються команди, запускаються скрипти, активуються експлойти. Система починає виконувати команди атакуючого.',
      'killChain.fullDescription.persistence':
        'Зловмисник закріплюється в системі, щоб зберегти доступ навіть після перезавантаження. Створюються автозапускаючі задачі, сервіси, змінюються реєстри.',
      'killChain.fullDescription.privilege-escalation':
        'Атакуючий отримує підвищені права доступу: від звичайного користувача до адміністратора, від користувача до root. Це розширює можливості атаки.',
      'killChain.fullDescription.defense-evasion':
        'Зловмисник ховається від систем захисту: відключає антивірус, видаляє логи, використовує легітимні інструменти, маскує активність.',
      'killChain.fullDescription.credential-access':
        'Крадіжка облікових даних: паролі, токени, ключі доступу. Це дозволяє переміщатися по мережі під виглядом легітимного користувача.',
      'killChain.fullDescription.discovery':
        'Вивчення системи: пошук файлів, баз даних, мережевих ресурсів, облікових записів. Збір інформації про структуру та вміст.',
      'killChain.fullDescription.lateral-movement':
        "Переміщення по мережі: від одного комп'ютера до іншого, використовуючи викрадені облікові дані або експлойти. Розширення зони контролю.",
      'killChain.fullDescription.collection':
        'Збір цільових даних: важливі файли, бази даних, документи, особиста інформація. Підготовка даних для крадіжки.',
      'killChain.fullDescription.command-and-control':
        "Встановлення каналу управління: зв'язок між зараженою системою та сервером атакуючого. Дозволяє віддалено керувати атакою.",
      'killChain.fullDescription.exfiltration':
        'Передача викрадених даних назовні: через інтернет, хмарні сервіси, USB-пристрої. Дані залишають захищене середовище.',
      'killChain.fullDescription.impact':
        'Завдання шкоди: видалення даних, шифрування файлів, зупинка сервісів, пошкодження системи. Фінальний етап атаки.',
      'killChain.goal.reconnaissance': 'дізнатися якомога більше про ціль',
      'killChain.goal.resource-development': 'підготувати інструменти для атаки',
      'killChain.goal.initial-access': 'проникнути в систему',
      'killChain.goal.execution': 'запустити шкідливий код',
      'killChain.goal.persistence': 'зберегти доступ надовго',
      'killChain.goal.privilege-escalation': 'отримати права адміністратора',
      'killChain.goal.defense-evasion': 'сховатися від захисту',
      'killChain.goal.credential-access': 'вкрасти логіни та паролі',
      'killChain.goal.discovery': 'вивчити структуру системи',
      'killChain.goal.lateral-movement': "переміститися на інші комп'ютери",
      'killChain.goal.collection': 'Зібрати важливі дані',
      'killChain.goal.command-and-control': "встановити зв'язок з атакуючим",
      'killChain.goal.exfiltration': 'передати дані назовні',
      'killChain.goal.impact': 'завдати шкоди системі або даним',
      'killChain.result.reconnaissance': 'Отримано інформацію про ціль, знайдено вразливості',
      'killChain.result.resource-development': 'Підготовлено інструменти та інфраструктуру',
      'killChain.result.initial-access': 'Отримано доступ до системи',
      'killChain.result.execution': 'Шкідливий код запущено',
      'killChain.result.persistence': 'Доступ збережено навіть після перезавантаження',
      'killChain.result.privilege-escalation': 'Отримано права адміністратора',
      'killChain.result.defense-evasion': 'Системи захисту обмануті',
      'killChain.result.credential-access': 'Вкрадено логіни та паролі',
      'killChain.result.discovery': 'Вивчено структуру системи',
      'killChain.result.lateral-movement': 'Отримано доступ до інших систем',
      'killChain.result.collection': 'Зібрано важливі дані (файли, бази даних)',
      'killChain.result.command-and-control': 'Встановлено канал управління',
      'killChain.result.exfiltration': 'Дані передано зловмиснику',
      'killChain.result.impact': 'Завдано шкоди системі або даним',
      'modal.whatIsThis': 'Що це таке?',
      'modal.platforms': 'Платформи:',
      'modal.positionInKillChain': 'Позиція в ланцюжку атак (Kill Chain)',
      'modal.howItWorks': 'Як це працює?',
      'modal.attackGoal': 'Мета атаки',
      'modal.attackResult': 'Результат атаки',
      'modal.examples': 'Приклади',
      'modal.howToProtect': 'Як захиститися?',
      'modal.completed': 'Освоєно',
      'modal.relatedMissions': "Пов'язані місії",
      'modal.goToMission': 'Перейти до місії',
      'mitigation.regular-updates': 'Регулярно оновлюйте системи безпеки',
      'mitigation.monitoring': 'Використовуйте моніторинг та логування',
      'mitigation.least-privilege': 'Застосовуйте принцип мінімальних привілеїв',
      'mitigation.mfa': 'Використовуйте багатофакторну аутентифікацію',
      'mitigation.training': 'Навчайте співробітників',
      'mitigation.segmentation': 'Використовуйте мережеву сегментацію',
      'mitigation.backup': 'Налаштуйте резервне копіювання',
      'mitigation.description.regular-updates':
        'Встановлення оновлень безпеки закриває відомі вразливості. Налаштуйте автоматичні оновлення для операційної системи, антивірусу, браузерів та іншого ПЗ. Це критично важливо, оскільки більшість атак використовують вже відомі вразливості.',
      'mitigation.description.monitoring':
        'Системи моніторингу та логування дозволяють відстежувати підозрілу активність у реальному часі. Налаштуйте централізоване логування, аналізуйте логи на предмет аномалій, використовуйте SIEM-системи для кореляції подій та раннього виявлення загроз.',
      'mitigation.description.least-privilege':
        'Користувачі та програми повинні мати лише ті права доступу, які необхідні для виконання їхніх задач. Це обмежує зону впливу при компрометації облікового запису або програми.',
      'mitigation.description.mfa':
        'MFA додає додатковий рівень захисту, вимагаючи підтвердження через кілька факторів (пароль + SMS/токен). Це значно ускладнює крадіжку облікових даних та несанкціонований доступ.',
      'mitigation.description.training':
        'Користувачі часто стають слабкою ланкою в безпеці. Регулярне навчання з кібербезпеки, фішингу та безпечних практик знижує ризик успішних атак через соціальну інженерію.',
      'mitigation.description.segmentation':
        'Розділення мережі на сегменти обмежує поширення атаки. Навіть якщо зловмисник проникне в один сегмент, він не зможе легко отримати доступ до критично важливих систем.',
      'mitigation.description.backup':
        'Регулярні резервні копії дозволяють швидко відновити систему після інциденту. Зберігайте копії окремо від основних систем, тестуйте процедури відновлення та використовуйте правило 3-2-1 (3 копії, 2 різних носії, 1 поза офісом).',
      'modal.examplesTitle': 'Приклади використання в атаках',
      'modal.action': 'Дія',
      'modal.result': 'Результат',
      'modal.relatedMissionsTitle': 'Місії в грі, де вивчається ця техніка',
      'modal.goToMission': 'Перейти до місії',
      'modal.dataSources': 'Джерела даних для виявлення:',
      'modal.usedOnStage': 'використовується на етапі',
      'modal.meansAttackerAlready': 'це означає, що зловмисник вже',
      'modal.openOnMitre': 'Відкрити на MITRE',
      'modal.copyId': 'Скопіювати ID техніки',
      'modal.idCopied': 'Скопійовано!',
      'example.data-from-local-system': 'Дані з локальної системи',
      'example.description.data-from-local-system':
        'Зловмисник збирає дані з локальної системи жертви, включаючи файли, конфігурації та іншу конфіденційну інформацію.',
      'example.defaultDescription':
        'Це приклад того, як {{example}} може використовуватися в атаках.',
      ...MITRE_TECHNIQUE_NAMES.uk,
      ...MITRE_TECHNIQUE_DESCRIPTIONS.uk,
      'tactic.Reconnaissance': 'Розвідка',
      'tactic.Resource Development': 'Підготовка ресурсів',
      'tactic.Initial Access': 'Початковий доступ',
      'tactic.Execution': 'Виконання',
      'tactic.Persistence': 'Стійкість',
      'tactic.Privilege Escalation': 'Підвищення привілеїв',
      'tactic.Defense Evasion': 'Обхід захисту',
      'tactic.Credential Access': 'Крадіжка облікових даних',
      'tactic.Discovery': 'Дослідження',
      'tactic.Lateral Movement': 'Бічне переміщення',
      'tactic.Collection': 'Збір даних',
      'tactic.Command and Control': 'Командування та управління',
      'tactic.Exfiltration': 'Викрадення даних',
      'tactic.Impact': 'Вплив',
      'tactic.explanation.Reconnaissance':
        'Це етап розвідки, коли зловмисник збирає інформацію про ціль перед атакою.',
      'tactic.explanation.Resource Development':
        'Зловмисник створює або отримує ресурси, необхідні для атаки (інструменти, інфраструктура).',
      'tactic.explanation.Initial Access':
        'Зловмисник отримує початковий доступ до системи або мережі.',
      'tactic.explanation.Execution':
        'Зловмисник виконує шкідливий код або команди на цільовій системі.',
      'tactic.explanation.Persistence':
        'Зловмисник зберігає доступ до системи навіть після перезавантаження або закриття сесії.',
      'tactic.explanation.Privilege Escalation':
        'Зловмисник отримує більш високі привілеї в системі (наприклад, права адміністратора).',
      'tactic.explanation.Defense Evasion':
        'Зловмисник намагається уникнути виявлення системами безпеки.',
      'tactic.explanation.Credential Access':
        'Зловмисник краде облікові дані (логіни, паролі) для доступу до систем.',
      'tactic.explanation.Discovery':
        'Зловмисник досліджує систему, щоб зрозуміти її структуру та знайти вразливості.',
      'tactic.explanation.Lateral Movement':
        'Зловмисник переміщується по мережі, отримуючи доступ до інших систем.',
      'tactic.explanation.Collection': 'Зловмисник збирає цікаві дані (файли, бази даних).',
      'tactic.explanation.Command and Control':
        "Зловмисник встановлює канал зв'язку з зараженою системою для управління.",
      'tactic.explanation.Exfiltration':
        'Зловмисник передає викрадені дані за межі цільової мережі.',
      'tactic.explanation.Impact':
        'Зловмисник завдає шкоди системі (видалення даних, шифрування, порушення роботи).',
      'tactic.explanation.default':
        'Ця техніка відноситься до тактики {{tactic}} в рамках MITRE ATT&CK Framework.',
      'killChain.defaultDescription': 'виконує дії',
      'killChain.defaultFullDescription': 'Етап атаки в Kill Chain.',
      'killChain.defaultGoal': 'виконати атаку',
      'killChain.defaultResult': 'Атаку виконано успішно',
      'mitigation.defaultDescription':
        'Ця рекомендація допоможе захистити вашу систему від кібератак. Дотримуйтеся найкращих практик безпеки для вашої інфраструктури.',
    },
    tasks: {
      success: 'УСПІХ!',
      successTitle: 'УСПІХ',
      successBody: 'Правильно! Завдання вже було виконано раніше, бали були нараховані.',
      failure: 'ПРОВАЛ:',
      failureTitle: 'ПРОВАЛ',
      error: 'ПОМИЛКА:',
      taskCompleted: 'Завдання виконано успішно!',
      wrongAnswer: 'Невірна відповідь',
      errorOccurred: 'Сталася помилка',
      nextLevel: 'Перейти до наступного завдання',
      allCompleted: '🎉 Всі завдання місії виконано!',
      execute: 'ВИКОНАТИ',
      executing: 'ВИКОНАННЯ...',
      enterRegexPattern: 'ВВЕДІТЬ REGEX-ШАБЛОН:',
      enterRegexPatternPlaceholder: 'Введіть regex-шаблон',
      enterCode: 'ВВЕДІТЬ КОД:',
      hints: 'Підказки:',
      showHints: 'Показати підказку',
      hideHints: 'Сховати підказку',
      phishingConstructorTitle: 'Фішинговий лист',
      sentenceConstructorHint: 'Натисни фрази, щоб зібрати лист. Клік по слоту — прибрати слово.',
      emailTo: 'Кому:',
      emailSubject: 'Тема:',
      emailBody: 'Текст:',
      emailAttachments: 'Вкладення:',
      emailSubjectPlaceholder: 'Введіть тему листа',
      emailBodyPlaceholder: 'Введіть текст листа',
      sendEmail: 'НАДІСЛАТИ ЛИСТ',
      sendingEmail: 'НАДСИЛАННЯ...',
    },
    ui: {
      selectMission: 'Виберіть кампанію для початку',
      workArea: 'Робоча область',
      unknownTask: 'Невідомий тип завдання',
      expandMenu: 'Розгорнути меню',
      collapseMenu: 'Згорнути меню',
      collapse: 'Згорнути',
      stealth: 'СТЕЛС',
      rank: 'РАНГ',
      xp: 'ДОСВІД',
      'rank.Script Kiddie': 'Скрипт-кіді',
      'rank.Novice Hacker': 'Новачок-хакер',
      'rank.Intermediate Hacker': 'Середній хакер',
      'rank.Advanced Hacker': 'Досвідчений хакер',
      'rank.Elite Hacker': 'Елітний хакер',
      'rank.description.Script Kiddie':
        'Початкова точка. У культурі кібербезпеки «скрипт-кіді» користується готовими інструментами без глибокого розуміння. У CyberTactics це старт вашого шляху в навчальних симуляціях етичного хакінгу.',
      'rank.description.Novice Hacker':
        'Ви розумієте основи розвідки, технік MITRE та логіку місій. Рівень початківця в основах red team.',
      'rank.description.Intermediate Hacker':
        'Впевнено проходите багатокрокові ланцюги атак, розумієте OPSEC і поєднуєте техніки в місіях.',
      'rank.description.Advanced Hacker':
        'Сильне тактичне мислення, управління стелсом і складні сценарні завдання.',
      'rank.description.Elite Hacker':
        'Рівень майстерності — глибоке знання MITRE, оптимальне проходження місій і навички оператора топ-рівня.',
      ranks: 'Звання',
      ranksIntro:
        'Звання відображають ваш досвід (XP) з місій. Це ігрова шкала прогресу — від Скрипт-кіді до Елітного хакера — натхненна культурою offensive security, а не офіційною сертифікацією.',
      ranksCurrent: 'Ваше звання',
      ranksXpRange: '{{from}}–{{to}} XP',
      ranksXpFrom: 'від {{xp}} XP',
      missions: 'Місії',
      skillMatrix: 'Навички',
      faq: 'FAQ',
      community: 'Спільнота',
      support: 'Підтримка',
      supportSubjectPlaceholder: '3–200 символів',
      supportMessagePlaceholder: '10–5000 символів',
      adminTickets: 'Звернення',
      adminTicketsClose: 'Закрити звернення',
      adminTicketsCloseTitle: 'Закрити звернення?',
      adminTicketsCloseMessage:
        'Звернення буде закрито, і на нього більше не можна буде відповісти.',
      adminTicketsCloseReasonLabel: 'Причина',
      adminTicketsCloseReasonCustomLabel: 'Власна причина',
      adminTicketsCloseReasonCustomPlaceholder: '3–500 символів',
      adminTicketsCloseSubmit: 'Закрити звернення',
      adminTicketsCloseClosing: 'Закриття...',
      adminTicketsCloseError: 'Не вдалося закрити звернення.',
      adminTicketsClosedAt: 'Закрито: {{date}}',
      'supportCloseReason.ANSWERED': 'Відповідь надана',
      'supportCloseReason.DECLINED': 'Звернення не відповідає вимогам',
      'supportCloseReason.CUSTOM': 'Інша причина',
      supportClosedReasonLabel: 'Причина закриття',
      notificationsOpen: 'Відкрити сповіщення',
      notificationsTitle: 'Сповіщення',
      notificationsMarkAllRead: 'Позначити всі',
      notificationsEmpty: 'Сповіщень поки немає.',
      'notification.supportReply.title': 'Відповідь підтримки',
      'notification.supportReply.body': 'Нова відповідь на: {{subject}}',
      'notification.rankUp.title': 'Нове звання!',
      'notification.rankUp.body': 'Ви досягли звання: {{rank}}',
      'notification.news.title': 'Новина',
      'notification.news.body': 'Нова публікація: {{title}}',
      footerCopyright: '© {{year}} CyberTactics. Усі права захищені.',
      news: 'Новини',
      newsEmpty: 'Новин поки немає.',
      newsLoadError: 'Не вдалося завантажити новини.',
      newsPermalink: 'Копіювати посилання',
      newsPermalinkCopied: 'Посилання скопійовано',
      newsPermalinkCopyError: 'Не вдалося скопіювати посилання.',
      adminNews: 'Керування новинами',
      adminNewsCreate: 'Нова публікація',
      adminNewsEdit: 'Редагування',
      adminNewsList: 'Усі публікації',
      adminNewsEmpty: 'Публікацій поки немає.',
      adminNewsPublished: 'Опубліковано',
      adminNewsDraft: 'Чернетка',
      adminNewsTitleUk: 'Заголовок (UK)',
      adminNewsTitleEn: 'Заголовок (EN)',
      adminNewsBodyUk: 'Текст (UK)',
      adminNewsBodyEn: 'Текст (EN)',
      adminNewsPublish: 'Опублікувати',
      adminNewsLoadError: 'Не вдалося завантажити новини.',
      adminNewsSaveError: 'Не вдалося зберегти новину.',
      adminNewsDeleteError: 'Не вдалося видалити новину.',
      adminNewsDeleteTitle: 'Видалити публікацію?',
      adminNewsDeleteMessage: 'Цю публікацію буде видалено назавжди.',
      leaderboard: 'Таблиця лідерів',
      leaderboardPosition: '#',
      leaderboardPlayer: 'Гравець',
      leaderboardLevels: 'Рівні',
      leaderboardTechniques: 'MITRE',
      leaderboardYou: 'ви',
      leaderboardEmpty: 'У таблиці лідерів поки немає гравців.',
      leaderboardLoadError: 'Не вдалося завантажити таблицю лідерів.',
      loading: 'Завантаження...',
      settings: 'Налаштування',
      profile: 'Профіль',
      inDevelopment: 'Розділ у розробці...',
      contextPanel: 'Панель контексту',
      currentMitreTechnique: 'Поточна техніка MITRE:',
      taskCompleted: 'Завдання виконано',
      taskStatusCompleted: 'Статус: Завдання виконано.',
      taskStatusNotCompleted: 'Статус: Завдання не виконано.',
      handlerTaskCompleted: 'Вітаю, завдання виконано! Ти успішно надав відповідь\n{{answer}}',
      levelCompletedTitle: 'Завдання виконано',
      levelCompletedHint: 'Переглянь діалог зліва або спробуй пройти завдання ще раз.',
      tryAgain: 'Пройти ще раз',
      nextAssignment: 'Наступне завдання',
      allMissionTasksCompleted: 'Всі завдання місії виконано!',
      missionCompletedBadge: 'Місія виконана',
      missionInProgressBadge: 'Місія в процесі',
      backToMissions: 'Повернутися до списку місій',
      stealthDepletedTitle: 'Stealth вичерпано',
      stealthDepletedMessage:
        'Поки стелс 0%, відповіді не приймаються. Оберіть спосіб відновлення:',
      stealthManageTitle: 'Стелс',
      stealthManageMessage: 'Поточний стелс: {{stealth}}%. Оберіть спосіб поповнення:',
      stealthOpenModal: 'Відкрити опції відновлення стелсу',
      stealthBuyMasking: 'Купити {{amount}}% маскування — відновити стелс',
      stealthMaskingUnavailable: 'Маскування (+{{amount}}%) перевищить 100% (зараз: {{stealth}}%).',
      stealthUpgradePlan: 'Перейти на платний тариф',
      stealthPassiveRecoveryIn: '+{{amount}}% стелсу відновиться автоматично через {{time}}.',
      stealthAtMax: 'Стелс уже на рівні 100%.',
      stealthPremiumMock: 'Оплата тарифу ще не підключена.',
      yourPreviousCorrectAnswer: 'Ваша попередня правильна відповідь:',
      correctAnswerForTraining: 'Правильна відповідь (для навчання):',
      handler: 'КООРДИНАТОР',
      system: '[Система]',
      handlerPrefix: '[КООРДИНАТОР]',
      hintPrefix: '[ПІДКАЗКА]',
      noDialogueAvailable: 'Діалог недоступний',
      backToAssignments: 'Назад до завдань',
      backToMissions: 'Назад до місій',
      assignmentsNotFound: 'Завдання не знайдені',
      loadingMissions: 'Завантаження місій...',
      loadingAssignments: 'Завантаження завдань...',
      loadingAssignment: 'Завантаження завдання...',
      noMissionsAvailable: 'Місії недоступні',
      missionAssignmentsSubtitle: 'Завдання місії ({{count}})',
      assignmentNo: 'Завдання {{n}}',
      assignmentStatusCompleted: 'Завершене',
      assignmentStatusLocked: 'Заблоковано',
      assignmentStatusIncomplete: 'Незавершене',
      assignmentPanelEmpty: 'Оберіть завдання зліва',
      assignmentPanelEmptyHint: 'Тут з’являться деталі, прогрес і контекст MITRE.',
      assignmentPanelLearnTitle: 'Чого навчишся',
      assignmentStart: 'Почати завдання',
      assignmentCompleted: 'Виконано',
      assignmentLocked: 'Заблоковано',
      taskTypeCaption: 'Тип завдання:',
      taskTypeCodeEditor: 'Редактор коду',
      taskTypeTacticalChoice: 'Тактичний вибір',
      taskTypePhishingConstructor: 'Конструктор фішингу',
      taskTypeSentenceConstructor: 'Конструктор фраз',
      mitreTechniques: 'Техніки MITRE ATT&CK:',
      more: 'ще',
      techniques: 'технік',
      'difficulty.beginner': 'початковий',
      'difficulty.intermediate': 'середній',
      'difficulty.advanced': 'просунутий',
      'specialization.OSINT Specialist': 'Спеціаліст з OSINT',
      'specialization.Penetration Tester': 'Тестувальник на проникнення',
      'specialization.Malware Analyst': 'Аналітик шкідливого ПЗ',
      'specialization.Network Security Expert': 'Експерт з мережевої безпеки',
    },
    skillMatrix: {
      title: 'Навички (MITRE ATT&CK)',
      progress: 'Прогрес освоєння',
      techniques: 'технік',
      techniquesShort: 'технік',
      searchPlaceholder: 'Пошук за ID, назвою, описом або тактикою...',
      filterAll: 'Всі техніки',
      filterCompleted: 'Тільки освоєні',
      filterIncomplete: 'Тільки неосвоєні',
      expandAll: 'Розгорнути все',
      collapseAll: 'Згорнути все',
      loading: 'Завантаження...',
      completed: 'Освоєно:',
      notFound: 'Техніки не знайдені',
      tryAnotherQuery: 'Спробуйте змінити пошуковий запит',
      notLoaded: 'Техніки MITRE ATT&CK ще не завантажені.',
      syncRequired: 'Виконайте синхронізацію через адмін-панель.',
    },
    profile: {
      title: 'Профіль',
      account: 'Обліковий запис',
      username: 'Ім’я користувача',
      email: 'Email',
      changePhoto: 'Змінити фото',
      cropTitle: 'Налаштування фото',
      zoom: 'Масштаб',
      cropHint: 'Перетягни фото, щоб змінити позицію. Використай повзунок для масштабу.',
      cancel: 'Скасувати',
      save: 'Зберегти',
      saving: 'Збереження...',
      logout: 'Вийти',
      invalidFileType: 'Дозволені лише JPG, PNG або WEBP.',
      fileTooLarge: 'Файл занадто великий (макс. 5 МБ).',
      uploadFailed: 'Не вдалося зберегти фото.',
    },
    faq: {
      title: 'Часті питання',
      intro: 'Відповіді про типи місій і як користуватися CyberTactics.',
      'section.missionTypes': 'Типи завдань у місіях',
      'section.platform': 'Користування платформою',
      'items.codeEditor.question': 'Що таке завдання «Редактор коду»?',
      'items.codeEditor.answer':
        'Ви пишете код або regex-шаблон у робочій області. Наприклад, шукаєте приховані дані в HTML або складаєте PowerShell-команду. Натисніть Виконати для перевірки. Помилкові спроби знижують стелс.',
      'items.tacticalChoice.question': 'Що таке завдання «Тактичний вибір»?',
      'items.tacticalChoice.answer':
        'Ви обираєте один варіант зі списку — наприклад, найправдоподібніший фішинговий домен або ключ реєстру для стійкості. Уважно прочитайте варіанти і підтвердіть вибір.',
      'items.phishingConstructor.question': 'Що таке завдання «Конструктор фішингу»?',
      'items.phishingConstructor.answer':
        'Ви збираєте фішинговий лист: тема, текст і інколи вкладення. Мета — обійти фільтри і схилити ціль до запуску payload без заборонених типів файлів (наприклад, .exe).',
      'items.sentenceConstructor.question': 'Що таке завдання «Конструктор фраз»?',
      'items.sentenceConstructor.answer':
        'Ви складаєте фрази або частини листа з блоків слів — крок за кроком формуєте переконливий соціальний інжиніринг. Заповніть усі обов’язкові поля перед відправкою.',
      'items.whatIs.question': 'Що таке CyberTactics?',
      'items.whatIs.answer':
        'Навчальна платформа для вивчення основ offensive security через симуляції місій. Завдання прив’язані до технік MITRE ATT&CK. Усе відбувається в безпечному середовищі — без реальних атак.',
      'items.howMissions.question': 'Як почати місію?',
      'items.howMissions.answer':
        'Відкрийте Місії, оберіть кампанію, потім завдання. Клік по картці показує справа, чого навчишся; стрілка або «Почати завдання» — вхід у гру. Завдання відкриваються по порядку — наступне після виконання попереднього.',
      'items.stealth.question': 'Що таке Стелс?',
      'items.stealth.answer':
        'Стелс — показник операційної безпеки. Помилки та «шумні» дії знижують його. При 0% відповіді не приймаються, поки не відновите. Клік по смузі СТЕЛС у шапці відкриває опції поповнення (маскування, очікування, тариф).',
      'items.xpRanks.question': 'Що таке досвід (XP) і звання?',
      'items.xpRanks.answer':
        'За виконані завдання ви отримуєте XP. Він підвищує звання від Скрипт-кіді до Елітного хакера. Клік по званню в шапці показує повну шкалу прогресу.',
      'items.skillMatrix.question': 'Що таке Матриця навичок?',
      'items.skillMatrix.answer':
        'Карта технік MITRE ATT&CK з місій. Розгорніть тактику, клікніть техніку — деталі, контекст kill chain і пов’язані місії. Освоєні техніки позначені зеленим.',
      'items.hints.question': 'Як працюють підказки?',
      'items.hints.answer':
        'У робочій області внизу — «Показати підказку». Підказки направляють без повної відповіді. Користуйтеся, коли застрягли — це частина навчального процесу.',
      'items.leaderboard.question': 'Що таке Таблиця лідерів?',
      'items.leaderboard.answer':
        'Порівняння прогресу з іншими гравцями: XP, пройдені рівні та освоєні техніки MITRE. Ваш рядок підсвічений.',
      'items.language.question': 'Як змінити мову?',
      'items.language.answer':
        'Перемикач мови у верхній панелі (UA / EN). Переклади підвантажуються без перезавантаження сторінки.',
    },
    community: {
      title: 'Спільнота',
      intro: 'Обговорюйте місії, техніки MITRE та поради щодо платформи з іншими операторами.',
      topicsHeading: 'Теми',
      discussionHeading: 'Обговорення',
      selectTopic: 'Оберіть тему зліва, щоб прочитати обговорення.',
      noTopics: 'У цій категорії поки немає тем.',
      originalPost: 'Початкове повідомлення',
      readOnlyNotice:
        'Форум поки лише для читання. Нові теми та відповіді з’являться в наступних оновленнях.',
      metaReplies: '{{count}} відповідей',
      replyCount: '{{count}} відпов.',
      'categories.all': 'Усі',
      'categories.general': 'Загальне',
      'categories.missions': 'Місії',
      'categories.mitre': 'MITRE',
      'categories.tips': 'Поради',
      'topics.welcome.title': 'Ласкаво просимо до спільноти CyberTactics',
      'topics.welcome.excerpt':
        'Представтеся та поділіться, з чого хочете почати — розвідка, фішинг чи lateral movement.',
      'topics.welcome.lastActivity': 'Остання активність: 2 дні тому',
      'topics.welcome.posts.op.author': 'Handler_Ops',
      'topics.welcome.posts.op.time': '12 січ · 09:40',
      'topics.welcome.posts.op.body':
        'Ласкаво просимо. Тут — debrief місій, питання з MITRE і досвід у симуляції. Без реальних цілей, експлойтів і чужих даних.',
      'topics.welcome.posts.r1.author': 'NovaFinLearner',
      'topics.welcome.posts.r1.time': '12 січ · 11:05',
      'topics.welcome.posts.r1.body':
        'Починаю з Operation Ghost. Поради щодо regex-розвідки без перефітингу патерну?',
      'topics.welcome.posts.r2.author': 'BlueTeamCurious',
      'topics.welcome.posts.r2.time': '13 січ · 08:20',
      'topics.welcome.posts.r2.body':
        'Те саме. Матриця навичок допомогла побачити, які тактики вже торкнувся в місіях.',
      'topics.ghostStart.title': 'Operation Ghost: оптимальний порядок для новачків?',
      'topics.ghostStart.excerpt':
        'Чи варто добити всю розвідку перед фішингом, чи перегравати провалені завдання?',
      'topics.ghostStart.lastActivity': 'Остання активність: 5 год тому',
      'topics.ghostStart.posts.op.author': 'ApexRookie',
      'topics.ghostStart.posts.op.time': '3 лют · 14:10',
      'topics.ghostStart.posts.op.body':
        'Ghost лінійний — чи є сенс повторювати PowerShell для IWR, чи одразу йти до persistence?',
      'topics.ghostStart.posts.r1.author': 'GhostClear',
      'topics.ghostStart.posts.r1.time': '3 лют · 15:02',
      'topics.ghostStart.posts.r1.body':
        'Пройди ланцюг один раз для unlock. Перегравай лише якщо втратив стелс на execution (-5) і хочеш чистий run.',
      'topics.ghostStart.posts.r2.author': 'Handler_Ops',
      'topics.ghostStart.posts.r2.time': '3 лют · 16:44',
      'topics.ghostStart.posts.r2.body':
        'Вибір домену (завдання 2) задає контекст фішингу — читай feedback на помилках, це аналог правил blue team.',
      'topics.ironSignal.title': 'Iron Signal: spray vs spearphish — де застрягають',
      'topics.ironSignal.excerpt': 'Password spraying і вільний текст spearphish — типові помилки.',
      'topics.ironSignal.lastActivity': 'Остання активність: 1 год тому',
      'topics.ironSignal.posts.op.author': 'SvcSprayFan',
      'topics.ironSignal.posts.op.time': '8 бер · 10:00',
      'topics.ironSignal.posts.op.body':
        'Spray зрозумілий, якщо згадаєш lockout policy. Spearphish складніший — потрібні ключові слова SSO в темі/тексті, не магічна exact phrase.',
      'topics.ironSignal.posts.r1.author': 'AnalystRoleplay',
      'topics.ironSignal.posts.r1.time': '8 бер · 10:35',
      'topics.ironSignal.posts.r1.body':
        'Дивись підказки для keyword groups. Без .exe у вкладеннях — фільтри блокують навіть при ідеальному тексті.',
      'topics.ironSignal.posts.r2.author': 'NovaFinLearner',
      'topics.ironSignal.posts.r2.time': '8 бер · 11:12',
      'topics.ironSignal.posts.r2.body':
        'LDAP regex: service accounts у OU=ServiceAccounts, не user mail.',
      'topics.killChain.title': 'Kill chain у briefing vs тактики MITRE',
      'topics.killChain.excerpt':
        'Чому в briefing «Фаза 2», а на чіпі — Credential Access чи Initial Access.',
      'topics.killChain.lastActivity': 'Остання активність: 3 дні тому',
      'topics.killChain.posts.op.author': 'FrameworkNerd',
      'topics.killChain.posts.op.time': '28 січ · 18:30',
      'topics.killChain.posts.op.body':
        'Кампанія використовує Cyber Kill Chain для сюжету; кожне завдання має свою техніку ATT&CK. Обидва шари навмисні — історія vs таксономія.',
      'topics.killChain.posts.r1.author': 'SkillMatrixUser',
      'topics.killChain.posts.r1.time': '29 січ · 09:15',
      'topics.killChain.posts.r1.body':
        'Відкрий модалку техніки з assignments — смуга kill chain і пояснення тактики знімають більшість питань.',
      'topics.stealthTips.title': 'Стелс: коли чекати, а коли купувати маскування',
      'topics.stealthTips.excerpt':
        'Відновлення в шапці — планування помилок у «шумних» завданнях.',
      'topics.stealthTips.lastActivity': 'Остання активність: 6 год тому',
      'topics.stealthTips.posts.op.author': 'QuietOperator',
      'topics.stealthTips.posts.op.time': '20 лют · 07:50',
      'topics.stealthTips.posts.op.body':
        'Завдання з мінусом стелса (PowerShell, certutil, spearphish) — дивись stat-картку перед submit. На 15% одна помилка може заблокувати відповіді.',
      'topics.stealthTips.posts.r1.author': 'MaskingBuyer',
      'topics.stealthTips.posts.r1.time': '20 лют · 08:30',
      'topics.stealthTips.posts.r1.body':
        'Маскування піднімає до 50% — добре перед фіналом місії. Пасивна регенерація повільна, але безкоштовна.',
      'topics.stealthTips.posts.r2.author': 'Handler_Ops',
      'topics.stealthTips.posts.r2.time': '20 лют · 09:01',
      'topics.stealthTips.posts.r2.body':
        'Спочатку підказки, submit впевнений — останнім. Кожна помилка коштує стелса на багатьох завданнях.',
      'topics.regexRecon.title': 'Regex-розвідка: email vs service account',
      'topics.regexRecon.excerpt':
        'Obfuscation email у Ghost і LDAP у Iron Signal — що реально перевіряє валідатор.',
      'topics.regexRecon.lastActivity': 'Остання активність: 12 год тому',
      'topics.regexRecon.posts.op.author': 'RegexRookie',
      'topics.regexRecon.posts.op.time': '1 бер · 13:00',
      'topics.regexRecon.posts.op.body':
        'Валідатор гонить патерн по test string, не завжди по всьому snippet. Ghost — форма email; Iron Signal — патерн імені service account.',
      'topics.regexRecon.posts.r1.author': 'SvcSprayFan',
      'topics.regexRecon.posts.r1.time': '1 бер · 14:22',
      'topics.regexRecon.posts.r1.body':
        'Почни просто: префікс svc_backup + character class. Ускладнюй лише якщо підказки кажуть про варіативне ім’я.',
    },
    agreement: {
      footerLink: 'Угода користувача',
      title: 'Угода користувача',
      intro:
        'Ласкаво просимо на CyberTactics. Користуючись цим сервісом, ви підтверджуєте, що ознайомилися з наведеними нижче умовами та погоджуєтеся їх дотримуватися.',
      'section1.title': '1. Призначення платформи',
      'section1.body':
        'CyberTactics — навчальна інтерактивна платформа, створена для зниження порогу входу в сферу кібербезпеки. Сервіс допомагає користувачам у безпечному середовищі засвоїти базові поняття захисту інформації, моделі атак (зокрема MITRE ATT&CK) та практики реагування на загрози.',
      'section2.title': '2. Навчальний характер і симуляція',
      'section2.body':
        'Усі сценарії, місії та завдання на платформі мають виключно навчальний характер. CyberTactics не здійснює атак на реальні системи, мережі чи сервери та не надає інструментів для дій поза навчальним контекстом. Будь-які дії в межах платформи є симуляцією і не спричиняють реальної шкоди інфраструктурі третіх осіб.',
      'section3.title': '3. Законне використання знань',
      'section3.body':
        'Знання, отримані на платформі, призначені виключно для законної діяльності: навчання, сертифікації, захисту власної або корпоративної інфраструктури в рамках чинного законодавства та етичних норм професії. Застосування знань для несанкціонованого доступу, пошкодження даних, шантажу, фішингу, розповсюдження шкідливого ПЗ чи інших протиправних дій суворо заборонено.',
      'section4.title': '4. Відповідальність користувача',
      'section4.body':
        "Користувач несе повну особисту відповідальність за свої дії поза межами платформи. Порушення законодавства щодо кіберзлочинів — зокрема несанкціоноване втручання в роботу комп'ютерів, крадіжка даних, шахрайство в сфері електронних комунікацій — тягне цивільну, адміністративну та кримінальну відповідальність відповідно до закону.",
      'section5.title': '5. Прийняття умов',
      'section5.body':
        "Продовжуючи користування платформою, ви підтверджуєте, що розумієте навчальний характер симуляцій і зобов'язуєтеся не використовувати отримані знання в протиправних цілях.",
      back: 'Назад',
    },
    missions: {
      'operation_ghost.name': 'Операція Привид',
      'operation_ghost.description':
        'Симуляція атаки на корпорацію Apex Dynamics. Пройди всі стадії Cyber Kill Chain від розвідки до встановлення persistence.',
      'operation_ghost.killChain.title': 'Ланцюг кібератак',
      'operation_ghost.killChain.intro': 'Завдання місії відповідають етапам атаки по порядку:',
      'operation_ghost.killChain.step1': 'Розвідка — знайти email адміністратора (завдання 1)',
      'operation_ghost.killChain.step2':
        'Розробка ресурсів — обрати домен для фішингу (завдання 2)',
      'operation_ghost.killChain.step3': 'Початковий доступ — фішинговий лист (завдання 3)',
      'operation_ghost.killChain.step4': 'Виконання — запуск PowerShell payload (завдання 4)',
      'operation_ghost.killChain.step5': 'Стійкість — автозапуск через реєстр (завдання 5)',
      'operation_ghost.killChain.expand': 'Показати ланцюг кібератак',
      'operation_ghost.killChain.collapse': 'Згорнути ланцюг кібератак',
      'operation_iron_signal.name': 'Операція Залізний Сигнал',
      'operation_iron_signal.description':
        'Проникнення в NovaFin Insurance: від розвідки AD-обліковок до password spray, spearphish-посилання, RDP lateral movement і staging через cmd.',
      'operation_iron_signal.killChain.title': 'Етапи атаки',
      'operation_iron_signal.killChain.intro':
        'Місія intermediate — тактики після периметра по порядку:',
      'operation_iron_signal.killChain.step1':
        'Discovery — знайти service account у AD dump (завдання 1)',
      'operation_iron_signal.killChain.step2':
        'Credential Access — стратегія password spray (завдання 2)',
      'operation_iron_signal.killChain.step3':
        'Initial Access — spearphishing з посиланням (завдання 3)',
      'operation_iron_signal.killChain.step4':
        'Lateral Movement — RDP через jump host (завдання 4)',
      'operation_iron_signal.killChain.step5':
        'Execution — завантаження staging через certutil (завдання 5)',
      'operation_iron_signal.killChain.expand': 'Показати етапи атаки',
      'operation_iron_signal.killChain.collapse': 'Згорнути етапи атаки',
    },
    levels: {
      'ghost_recon_01.title': 'Пошук на відкритих веб-сайтах',
      'ghost_resource_02.title': 'Типосквоттинг доменів',
      'ghost_initial_03.title': 'Створення фішингового листа',
      'ghost_execution_04.title': 'Виконання PowerShell payload',
      'ghost_persistence_05.title': 'Стійкість через реєстр',
      'iron_discovery_01.title': 'Розвідка облікових записів AD',
      'iron_spray_02.title': 'Стратегія password spraying',
      'iron_spearphish_03.title': 'Spearphishing з посиланням',
      'iron_lateral_04.title': 'Lateral movement через RDP',
      'iron_staging_05.title': 'Staging через Windows Command Shell',
    },
    dialogues: {
      "[System]: Mission 'Operation Ghost' started.": "Місія 'Операція Привид' розпочата.",
      'Target: Apex Dynamics.': 'Ціль: Apex Dynamics.',
      'We need their admin email. Check this HTML snippet from their dev server. Stay quiet.':
        'Нам потрібен їхній email адміністратора. Перевір цей HTML фрагмент з їхнього dev сервера. Тримайся тихо.',
      '[System]: Phase 1 - Reconnaissance completed. Email secured.':
        'Фаза 1 - Розвідка завершена. Email отримано.',
      'Good. Now we need a domain for phishing. Choose wisely - it should look legitimate but bypass their filters.':
        'Добре. Тепер нам потрібен домен для фішингу. Вибирай розумно - він повинен виглядати легітимно, але обходити їхні фільтри.',
      '[System]: Phase 2 - Initial Access. Target email secured.':
        'Фаза 2 - Початковий доступ. Email цілі отримано.',
      'Okay, craft a phishing email to admin_backup. Their filters are strict. No .exe files. You need to trick them into running a payload.':
        'Добре, створи фішинговий лист для admin_backup. Їхні фільтри суворі. Без .exe файлів. Тобі потрібно обдурити їх, щоб вони запустили payload.',
      '[System]: Phase 3 - Execution. Target opened the attachment.':
        'Фаза 3 - Виконання. Ціль відкрила вкладення.',
      'Perfect. Now write a PowerShell command to download our payload. Use Invoke-WebRequest. Keep it quiet - no verbose output.':
        'Ідеально. Тепер напиши PowerShell команду для завантаження нашого payload. Використовуй Invoke-WebRequest. Тримайся тихо - без verbose виводу.',
      '[System]: Phase 4 - Persistence. Payload executed.': 'Фаза 4 - Стійкість. Payload виконано.',
      'Last step. Choose the registry key for autorun. We need it to survive reboots but not trigger UAC.':
        'Останній крок. Виберіть ключ реєстру для автозапуску. Нам потрібно, щоб він вижив після перезавантаження, але не викликав UAC.',
      "[System]: Mission 'Operation Iron Signal' started.":
        "Місія 'Операція Залізний Сигнал' розпочата.",
      'Target: NovaFin Insurance internal network.': 'Ціль: внутрішня мережа NovaFin Insurance.',
      'We dumped a slice of LDAP from their DC. Find the service account we can spray — not a regular user mailbox.':
        'Ми зняли фрагмент LDAP з їхнього DC. Знайди service account для spray — не звичайний user mailbox.',
      '[System]: Phase 1 - Discovery complete. Service account identified.':
        'Фаза 1 - Discovery завершена. Service account ідентифіковано.',
      'NovaFin locks accounts after five failures. Pick a spray plan that avoids lockout and stays quiet.':
        "NovaFin блокує акаунти після п'яти невдалих спроб. Обери план spray без lockout і з мінімальним шумом.",
      '[System]: Phase 2 - Credential Access. Valid creds for finance analyst obtained.':
        'Фаза 2 - Credential Access. Отримано валідні creds фінансового аналітика.',
      'Compose a spearphish to analyst@novafin.local. Drive them to our fake SSO page — no executables in attachments.':
        'Склади spearphish для analyst@novafin.local. Поведи на fake SSO — без .exe у вкладеннях.',
      '[System]: Phase 3 - Initial Access. Analyst session captured.':
        'Фаза 3 - Initial Access. Сесію аналітика перехоплено.',
      'Move to the finance server. Their bastion is monitored — choose the path that blends in.':
        'Перейди на finance server. Bastion під моніторингом — обери шлях, що не виділяється.',
      '[System]: Phase 4 - Lateral Movement. FIN-SRV01 access confirmed.':
        'Фаза 4 - Lateral Movement. Доступ до FIN-SRV01 підтверджено.',
      'Stage the payload on disk using certutil — PowerShell is heavily logged here. One quiet command.':
        'Завантаж staging на диск через certutil — PowerShell тут під жорстким логуванням. Одна тиха команда.',
    },
  },
};

export async function seedTranslations() {
  console.log('🌱 Seeding translations...');

  const operations = [];

  for (const [locale, namespaces] of Object.entries(translations)) {
    for (const [namespace, keys] of Object.entries(namespaces)) {
      for (const [key, value] of Object.entries(keys)) {
        operations.push(
          prisma.translation.upsert({
            where: {
              key_locale_namespace: {
                key,
                locale,
                namespace,
              },
            },
            update: {
              value: value as string,
            },
            create: {
              key,
              locale,
              namespace,
              value: value as string,
            },
          })
        );
      }
    }
  }

  await prisma.$transaction(operations);
  console.log(`✅ Seeded ${operations.length} translations`);
}

seedTranslations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
