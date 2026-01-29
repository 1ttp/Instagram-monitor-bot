Instagram Monitor Discord Bot:                
A Discord bot that monitors Instagram accounts for ban and unban status changes. Get real-time notifications when an Instagram account gets banned or reactivated.

Features
Ban Monitoring: Track Instagram accounts and get notified when they get banned
Unban Monitoring: Monitor banned accounts and get alerted when they're reactivated
Real-time Updates: Continuous monitoring with 90-second check intervals
Access Control: Manage who can use the bot with user ID whitelisting
Watch Lists: View all currently monitored accounts
Rich Embeds: Beautiful Discord embed notifications with timestamps
Error Handling: Comprehensive error handling with DM notifications
Table of Contents
Installation
Configuration
Commands
Workflow
Project Structure
Contributing
License
Installation
Prerequisites
Node.js v16.9.0 or higher
npm or yarn
A Discord Bot Token
Discord.js v14+
Setup Steps
Clone the repository

git clone https://github.com/brahmjotsinghmonga-source/Instagram-monitor-bot
Install dependencies

npm install
Configure environment variables

Copy .env.example to .env
cp .env.example .env
Edit .env and add your Discord bot token and allowed user IDs:
DISCORD_TOKEN=your_actual_discord_bot_token
ALLOWED_USER_IDS=your_user_id_1,your_user_id_2
CHECK_INTERVAL=90000
Run the bot

npm start
Configuration
Environment Variables
All configuration is done through environment variables in the .env file:

DISCORD_TOKEN: Your Discord bot token (required)
ALLOWED_USER_IDS: Comma-separated list of Discord user IDs who can use the bot
CHECK_INTERVAL: Time between checks in milliseconds (default: 90000 = 90 seconds)
Example .env file:

DISCORD_TOKEN=your_actual_discord_bot_token_here
ALLOWED_USER_IDS=1234567890,0987654321
CHECK_INTERVAL=90000
Bot Intents
Required Discord Gateway Intents:

Guilds
GuildMessages
MessageContent
DirectMessages
Commands
Command	Description	Usage	Access
!banwatch	Monitor an Instagram account for bans	!banwatch <username>	All allowed users
!unbanwatch	Monitor a banned account for reactivation	!unbanwatch <username>	All allowed users
!banlist	View all accounts being monitored for bans	!banlist	All allowed users
!unbanlist	View all accounts being monitored for unbans	!unbanlist	All allowed users
!giveaccess	Grant bot access to a new user	!giveaccess <user_id>	Admin only
!help	Display help message with all commands	!help	All users
!fake	Generate a test embed (demo purposes)	!fake	All allowed users
Workflow
Ban Watch Workflow
flowchart TD
    A[User: !banwatch username] --> B{Check Account Status}
    B -->|Account Valid| C[Add to Ban Watch List]
    B -->|Account Banned| D[Return Error: Already Banned]
    C --> E[Start Monitoring Every 90s]
    E --> F{Account Status Check}
    F -->|Still Valid| E
    F -->|Banned| G[Send Ban Notification]
    G --> H[Remove from Watch List]
    H --> I[Stop Monitoring]
Unban Watch Workflow
flowchart TD
    A[User: !unbanwatch username] --> B{Check Account Status}
    B -->|Account Banned| C[Add to Unban Watch List]
    B -->|Account Valid| D[Return Error: Not Banned]
    C --> E[Start Monitoring Every 90s]
    E --> F{Account Status Check}
    F -->|Still Banned| E
    F -->|Reactivated| G[Send Reactivation Notification]
    G --> H[Remove from Watch List]
    H --> I[Stop Monitoring]
Access Control Workflow
flowchart TD
    A[User: !giveaccess user_id] --> B{Check Requester Permission}
    B -->|Not Authorized| C[Return Access Denied]
    B -->|Authorized| D{Check if User Already Has Access}
    D -->|Yes| E[Return Already Has Access]
    D -->|No| F[Add User to Allowed List]
    F --> G[Send Success Confirmation]
Overall System Architecture
graph TB
    subgraph Discord
        A[Discord User]
    end
    
    subgraph Bot
        B[Discord.js Client]
        C[Command Handler]
        D[Monitor Manager]
        E[Access Control]
    end
    
    subgraph Instagram
        F[Instagram API/Scraper]
    end
    
    subgraph Data Storage
        G[Watch Lists]
        H[User Cache]
    end
    
    A -->|Commands| B
    B --> C
    C --> E
    E -->|Authorized| D
    D -->|Check Status| F
    F -->|Status Response| D
    D --> G
    D --> H
    D -->|Notifications| B
    B -->|Embeds| A
Monitoring Loop Process
sequenceDiagram
    participant User
    participant Bot
    participant Instagram
    participant Discord
    
    User->>Bot: !banwatch username
    Bot->>Instagram: Check initial status
    Instagram-->>Bot: Account status
    
    alt Account is valid
        Bot->>Discord: Send monitoring started embed
        Bot->>Bot: Add to watch list
        
        loop Every 90 seconds
            Bot->>Instagram: Check account status
            Instagram-->>Bot: Current status
            
            alt Account banned
                Bot->>Discord: Send ban notification
                Bot->>Bot: Remove from watch list
                Bot->>Bot: Stop monitoring
            end
        end
    else Account already banned
        Bot->>Discord: Send error embed
    end
Project Structure
ig-monitor/
├── index.js           # Main bot file
├── package.json       # Dependencies and scripts
├── README.md          # This file
└── .gitignore        # Git ignore file
How It Works
Account Status Detection
The bot checks Instagram account status by:

Fetching the Instagram profile page
Parsing the og:description meta tag
Analyzing the description length to determine ban status
Length = 3: Account is banned
Length > 3: Account is active
Monitoring System
Interval: Checks every 90 seconds
Concurrency: Multiple accounts can be monitored simultaneously
State Management: Uses watchedAccounts object and separate ban/unban watch lists
Automatic Cleanup: Removes accounts from watch lists after status change detected
Security Considerations
Important Security Notes:

Never commit your bot token - The token in the code should be replaced with environment variables
Use environment variables for sensitive data:
const TOKEN = process.env.DISCORD_TOKEN;
Implement rate limiting to prevent Instagram from blocking requests
Regular token rotation is recommended for production use
Error Handling
The bot includes comprehensive error handling:

Command validation
Permission checks
API error handling
DM notifications for errors
Console logging for debugging
Features in Detail
Rich Embeds
All notifications use Discord's rich embed system with:

Color coding (Black: #000000, Red: #FF0000, etc.)
Timestamps
Author information
Footer branding
Animated GIFs for visual feedback
Caching
The bot maintains caches for:

Ban status (bancache)
Unban status (unbancache)
Follower data (storedFollowerData)
Contributing
Contributions are welcome! Please follow these steps:

Fork the repository
Create a feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments
Discord.js - Discord API wrapper
Instagram - Profile data source
Support
For support, please open an issue in the GitHub repository or contact the maintainers.

Disclaimer
This bot is for educational purposes only. Please respect Instagram's Terms of Service and rate limits. The developers are not responsible for any misuse of this software.

Made by Brahmjot Monga 
