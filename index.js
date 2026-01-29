const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

var bancache = {};
var unbancache = {};

async function check(username) {
    const req = await fetch("https://instagram.com/"+username+'/', {
        "credentials": "omit",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Sec-GPC": "1",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Priority": "u=4"
        },
        "method": "GET",
        "mode": "cors"
    });
    const res = await req.text();
    console.log(req)
    const sp =res.split('<meta property="og:description" content="');
    console.log(sp.length);
    if (sp.length>1) {
        return sp[1].split('-')[0];
    } else {
        return 'N/A'
    }
}

const TOKEN = process.env.DISCORD_TOKEN;
const ALLOWED_USER_IDS = process.env.ALLOWED_USER_IDS ? process.env.ALLOWED_USER_IDS.split(',') : [];
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 90000;

let watchedAccounts = {}; 
let storedFollowerData = {};  

const allowedUserIds = [...ALLOWED_USER_IDS];
const banWatchList = [];
const unbanWatchList = [];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
});

client.once('ready', () => {
    console.log(`We have logged in as ${client.user.tag}`);
});

function formatTimestamp(date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

async function monitorAccount(message, username, url, expectedStatus, startTime, watchType) {
    while (watchedAccounts[username]) {
        try {
            const info = await check(username);
            console.log(`Monitoring ${username}`);
            const currentTime = Date.now()
            const timeDifference = Math.abs(currentTime - startTime) / 1000;
            const timeDifferenceMinutes = Math.floor(timeDifference / 60);

            if (expectedStatus === 'valid' && info.length == 3) {
                const embed = new EmbedBuilder()
                    .setTitle(`Account Has Been Smoked! | ${username} ✅`)
                    .setDescription(`**Time Taken:** ${timeDifferenceMinutes} minutes\n${info}`)
                    .setColor(0x000000)
                    .setFooter({ text: 'Monitor Bot v1', iconURL: client.user.displayAvatarURL() });

                await message.channel.send({ embeds: [embed] });
                delete watchedAccounts[username];
                const index = banWatchList.indexOf(username);
                if (index > -1) {
                    banWatchList.splice(index, 1);
                }
                break;
            } else if (watchType === 'unbanwatch' && expectedStatus === 'valid' && info.length > 3) {
                const embed = new EmbedBuilder()
                    .setTitle(`Account has been reactivated Successfully! | ${username} ✅`)
                    .setDescription(`**Time Taken:** ${timeDifferenceMinutes} minutes`+info)
                    .setColor(0x000000)
                    .setFooter({ text: 'Monitor Bot v1', iconURL: client.user.displayAvatarURL() });

                await message.channel.send({ embeds: [embed] });
                delete watchedAccounts[username];
                const indexUnban = unbanWatchList.indexOf(username);
                if (indexUnban > -1) {
                    unbanWatchList.splice(indexUnban, 1);
                }
                break;
            }
        } catch (error) {
            console.error(`Error during monitoring for ${username}:`, error);
            sendErrorDM(message.author.id, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
}


client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!giveaccess')) {
        const args = message.content.split(' ');

        if (!allowedUserIds.includes(message.author.id)) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Access Denied')
                .setDescription('You do not have permission to use this command.')
                .setColor(0xFF0000)
                .setFooter({ text: 'Permission required', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
            return;
        }

        if (args.length < 2 || !args[1]) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Requested by @${message.author.username}` })
                .setTitle('❌ Missing User ID')
                .setDescription('You need to specify a user ID to give access.\n\n**Usage:** `!giveaccess <user id>`')
                .setColor(0xFF0000)
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Please try again', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
            return;
        }

        const userIdToAdd = args[1];

        if (allowedUserIds.includes(userIdToAdd)) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Requested by @${message.author.username}` })
                .setTitle('👀 Already Has Access')
                .setDescription(`User with ID **${userIdToAdd}** already has access.`)
                .setColor(0xFFC107)
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Access already granted', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
            return;
        }

        allowedUserIds.push(userIdToAdd);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Requested by @${message.author.username}` })
            .setTitle('✅ Access Granted')
            .setDescription(`User with ID **${userIdToAdd}** has been granted access.`)
            .setColor(0x28A745)
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: 'Access granted successfully', iconURL: client.user.displayAvatarURL() });

        await message.channel.send({ embeds: [embed] });
    } else if (message.content.startsWith('!unbanwatch')) {
        const args = message.content.split(' ');
        if (args.length < 2 || !args[1]) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Requested by @${message.author.username}` })
                .setTitle('❌ Missing Username')
                .setDescription('You need to specify a username to unbanwatch.\n\n**Usage:** `!unbanwatch <username>`')
                .setColor(0xFF0000)
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Please try again', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
            return;
        }

        const username = args[1];
        const url = `https://www.instagram.com/${username}/?hl=en`;
        const startTime = new Date();

        const info = await check(username);

        if (info.length == 3) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Requested by @${message.author.username} ${formatTimestamp(startTime)}` })
                .setTitle('👀 Account Banned')
                .setDescription(`The Instagram account **@${username}** is currently banned. Monitoring for reactivation...`)
                .setColor(0x000000)
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Monitoring in progress', iconURL: client.user.displayAvatarURL() })
                .setImage('https://media.giphy.com/media/niNTPEoAhOSli/giphy.gif');

            await message.channel.send({ embeds: [embed] });
            unbancache[username] = info;
            watchedAccounts[username] = true;
            unbanWatchList.push(username);

            let hasSentEmbed = false;  

            const intv = setInterval(async function() {
                try {
                    const infoa = await check(username);
                    const currentTime = Date.now();
                    const timeDifference = Math.abs(currentTime - startTime) / 1000;
                    const timeDifferenceMinutes = Math.floor(timeDifference / 60);

                    if (infoa.length > 3 && !hasSentEmbed) {
            const embed = new EmbedBuilder()
                .setTitle(`Account has been reactivated Successfully! | ${username} ✅`)
                .setDescription(` Time Taken: ${timeDifferenceMinutes} minutes ` + infoa)
                .setColor(0x000000)
                .setFooter({ text: 'Monitor Bot v1', iconURL: client.user.displayAvatarURL() });

                        await message.channel.send({ embeds: [embed] });
                        hasSentEmbed = true;  
                        clearInterval(intv);

                        const indexUnban = unbanWatchList.indexOf(username);
                        if (indexUnban > -1) {
                            unbanWatchList.splice(indexUnban, 1);
                        }
                    }
                } catch (error) {
                    console.error(`Error during monitoring for ${username}:`, error);
                    sendErrorDM(message.author.id, error.message);
                }
            }, CHECK_INTERVAL);
        } else {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Requested by @${message.author.username} ${formatTimestamp(startTime)}` })
                .setTitle('❌ Invalid for Unban Watch')
                .setDescription(`The Instagram account **@${username}** is not banned and cannot be watched for reactivation.`)
                .setColor(0xFF0000)
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Please try again', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
        }
    } else if (message.content.startsWith('!banwatch')) {
        const args = message.content.split(' ');
        if (args.length < 2 || !args[1]) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Requested by @${message.author.username}` })
                .setTitle('❌ Missing Username')
                .setDescription('You need to specify a username to banwatch.\n\n**Usage:** `!banwatch <username>`')
                .setColor(0xFF0000)
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Please try again', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
            return;
        }

        const username = args[1];
        const url = `https://instagram.com/${username}`;
        const startTime = new Date();

        const info = await check(username)

        if (info.length != 3) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Requested by @${message.author.username} ${formatTimestamp(startTime)}` })
                .setTitle('👀 Monitoring Initiated')
                .setDescription(`The Instagram account **@${username}** is currently valid. Monitoring for any bans...`)
                .setColor(0x000000)
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Monitoring in progress', iconURL: client.user.displayAvatarURL() })
                .setImage('https://media.giphy.com/media/niNTPEoAhOSli/giphy.gif');

            await message.channel.send({ embeds: [embed] });
            watchedAccounts[username] = true;
            banWatchList.push(username);
            const intv = setInterval(async function() {
                const infoa = await check(username)
                if (infoa.length == 3) {
                    const currentTime = Date.now()
                    const timeDifference = Math.abs(currentTime - startTime) / 1000;
                    const timeDifferenceMinutes = Math.floor(timeDifference / 60);
                    const embed = new EmbedBuilder()
                        .setTitle(`Account Has Been Smoked! | ${username} ✅`)
                        .setDescription(`Time Taken: ${timeDifferenceMinutes} minutes ${info}`)
                        .setColor(0x000000)
                        .setFooter({ text: 'Monitor Bot v1', iconURL: client.user.displayAvatarURL() });
                    const index = banWatchList.indexOf(username);
                    if (index > -1) {
                        banWatchList.splice(index, 1);
                    }
                    await message.channel.send({ embeds: [embed] });
                    clearInterval(intv)
                }
            }, CHECK_INTERVAL)
        } else {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Requested by @${message.author.username} ${formatTimestamp(startTime)}` })
                .setTitle('❌ Invalid for Ban Watch')
                .setDescription(`The Instagram account **@${username}** is already banned and cannot be watched for bans.`)
                .setColor(0xFF0000)
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Please try again', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
        }
    } else if (message.content.startsWith('!banlist')) {
        if (banWatchList.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('📜 Ban Watch List')
                .setDescription('No accounts are currently being monitored for bans.')
                .setColor(0x000000)
                .setFooter({ text: 'Ban watch list is empty', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setTitle('📜 Ban Watch List')
                .setDescription(banWatchList.map(username => `• **@${username}**`).join('\n'))
                .setColor(0x000000)
                .setFooter({ text: 'Current ban watch list', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
        }
    } else if (message.content.startsWith('!unbanlist')) {
        if (unbanWatchList.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('📜 Unban Watch List')
                .setDescription('No accounts are currently being monitored for unbans.')
                .setColor(0x000000)
                .setFooter({ text: 'Unban watch list is empty', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setTitle('📜 Unban Watch List')
                .setDescription(unbanWatchList.map(username => `• **@${username}**`).join('\n'))
                .setColor(0x000000)
                .setFooter({ text: 'Current unban watch list', iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [embed] });
        }
    } else if (message.content.startsWith('!help')) {
        const embed = new EmbedBuilder()
            .setTitle('📖 Help - Available Commands')
            .setDescription(`
            **!banwatch <username>** - Starts monitoring an Instagram account for being banned.
            **!unbanwatch <username>** - Starts monitoring an Instagram account for being unbanned.
            **!banlist** - Displays a list of all accounts currently being monitored for bans.
            **!unbanlist** - Displays a list of all accounts currently being monitored for unbans.
            **!giveaccess <user id>** - Grants access to a user by adding them to the allowed list.
            **!help** - Displays this help message.
            `)
            .setColor(0x000000)
            .setThumbnail('https://media.giphy.com/media/or0s8qzLMNyJW/giphy.gif')
            .setFooter({ text: 'Requested by ' + message.author.username, iconURL: client.user.displayAvatarURL() });

        await message.channel.send({ embeds: [embed] });
    }else if (message.content.startsWith('!fake')) {
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('Account has been smoked! ✅ | example_username')
            .setDescription(`Time Taken: 0hr 2m 53s | Followers: 65`)
            .setFooter({ text: 'Monitor Bot v1' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
});

async function sendErrorDM(userId, errorMessage) {
    try {
        const user = await client.users.fetch(userId);
        const embed = new EmbedBuilder()
            .setAuthor({ name: `Requested by @${user.username} ${formatTimestamp(new Date())}` })
            .setTitle('❌ Error')
            .setDescription(`An error occurred: **${errorMessage}**`)
            .setColor(0xFF0000)
            .setFooter({ text: 'Please try again later', iconURL: client.user.displayAvatarURL() })
            .setImage('https://media.giphy.com/media/niNTPEoAhOSli/giphy.gif');

        await user.send({ embeds: [embed] });
    } catch (dmError) {
        console.error('Failed to send error DM:', dmError);
    }
}


client.login(TOKEN);
