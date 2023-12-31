import React, { useState, useEffect, useMemo } from 'react';
import { Menu, Item, Separator, Submenu, useContextMenu } from 'react-contexify';
import { DialogCard, GroupCard, ChannelCard } from "../Cards/Cards"
import ChatCM from '../ContextMenus/ChatCM';
import { createDialod, joinChannel, searchChats } from '../../Utilities/signalrMethods';
import { findLastMessage, getCurrentUserRole } from '../../Utilities/chatFunctions';
import "./ChatList.scss"


function ChatList({ connection, chatData, onlineUsers, setCurrentChatId,currentChatId }) { 
    const [listMode, setListMode] = useState("Filter");
    const [fieldInput, setFieldInput] = useState("");
    const [foundData, setFoundData] = useState(null);
    const [timeoutId, setTimeoutId] = useState(null);
    const [foundUsersMode, setFoundUsersMode] = useState("full");
    const [foundChannelsMode, setFoundChannelsMode] = useState("full");

    const ContextType = "Chat";

    function Filter(item) {
        if (!item || fieldInput==="") {
            return item;
        }
        if (item.Type==="Dialog" && item.Companion && item.Companion.Name && typeof item.Companion.Name === 'string' ) {
            return item.Companion.Name.toLowerCase().includes(fieldInput.toLowerCase());
        }
        else if (item.Type !== "Dialog") {
            return item.Title.toLowerCase().includes(fieldInput.toLowerCase());
        }
        return item;
    }

    const [isClickable, setIsClickable] = useState(true);

    const CreateDialog = (itemId) => {
        if (isClickable) {
            setIsClickable(false);
            createDialod(connection, itemId);
            setTimeout(() => {
                setIsClickable(true);
            }, 3000);
        }
    };

    const ExpandAndHide = (expand,setExpand, hide,setHide) => {
        if (expand === "full" && hide!=="full") {
            setHide("full");
            return;
        }
        setExpand("full");
        setHide("collapsed");
    }

    const JoinChannel = (channelId) => {
        if (isClickable) {
            setIsClickable(false);
            joinChannel(connection, channelId)
                .then(() => {
                    setFoundData((foundData) => {
                        const updatedData = foundData.Channels.filter((channel) => channel.Id !== channelId);
                        return {
                            ...foundData,
                            Channels: updatedData,
                        };
                    });
                })
                .catch((error) => {
                    console.error('fail', error);
                });
            setTimeout(() => {
                setIsClickable(true);
            },300);
        }
    }

    const chatCards = useMemo(() => {
        const calculateUnreadCount = (chatItem) => {
            let unreadCount = 0;
            const unreadMes = findLastMessage(chatItem);
            const onlyMessages = chatItem.Messages.filter(m => !m.notification);
            if (unreadMes && chatItem.Messages) {
                const unreadIndex = chatItem.Messages.findIndex(m => m.Id === unreadMes.Id);
                if (unreadIndex >= 0) {
                    unreadCount = onlyMessages.length - unreadIndex - 1;
                }
            }
            else {
                const curUser = localStorage.getItem("currentUser");
                unreadCount = onlyMessages.filter(m => m.sender !== curUser).length;
                if (unreadCount > 0) unreadCount = "!";
            }
            return unreadCount;
        };

        const pinnedChats = chatData.chats.filter(item => item.isPinned);
        const otherChats = chatData.chats.filter(item => !item.isPinned);

        const generateChatCard = (item) => {
            const extraClass = `${item.Id === currentChatId ? 'active-chat' : ''}`;
            const unreadCount = calculateUnreadCount(item);

            let chatCard = null;
            switch (item.Type) {
                case 'Dialog':
                    chatCard = (
                        <DialogCard
                            key={item.Id}
                            item={item}
                            onlineUsers={onlineUsers}
                            func={setCurrentChatId}
                            connection={connection}
                            extraClasses={extraClass}
                            contextMenu={ContextType}
                        >
                            {unreadCount > 0 && <div className="unread-count">{unreadCount}</div>}
                        </DialogCard>
                    );
                    break;
                case 'Group':
                    chatCard = (
                        <GroupCard
                            key={item.Id}
                            item={item}
                            onlineUsers={onlineUsers}
                            setCurrentChatId={setCurrentChatId}
                            extraClasses={extraClass}
                            contextMenu={ContextType}
                            connection={connection}
                        >
                            {unreadCount > 0 && <div className="unread-count">{unreadCount}</div>}
                        </GroupCard>
                    );
                    break;
                case 'Channel':
                    chatCard = (
                        <ChannelCard
                            key={item.Id}
                            item={item}
                            func={setCurrentChatId}
                            extraClasses={extraClass}
                            contextMenu={ContextType}
                            connection={connection}
                        >
                            {unreadCount > 0 && <div className="unread-count">{unreadCount}</div>}
                        </ChannelCard>
                    );
                    break;
                default:
                    break;
            }

            return chatCard;
        };

        const pinnedChatCards = pinnedChats.map(generateChatCard);
        const otherChatCards = otherChats.map(generateChatCard);

        return [...pinnedChatCards, ...otherChatCards];
    }, [chatData, currentChatId, onlineUsers, connection]);

    const foundUsersSection = useMemo(() => {
        return (
            <div className={`FoundUsers ${foundUsersMode}`}>
                <p onClick={() => { ExpandAndHide(foundUsersMode, setFoundUsersMode, foundChannelsMode, setFoundChannelsMode) }}>Users:</p>
                <div className={`Inner`} >
                    {foundData && foundData.Users && foundData.Users.length > 0 ? (
                        foundData.Users.map((item) => {
                            return <DialogCard key={item.Id} item={item} onlineUsers={onlineUsers} func={CreateDialog} />;
                        })
                    ) : (
                        <>empty</>
                    )}
                </div>
            </div>
        );
    }, [foundUsersMode, setFoundUsersMode, foundChannelsMode, setFoundChannelsMode, foundData, onlineUsers]);

    const foundChannelsSection = useMemo(() => {
        return (
            <div className={`FoundChannels ${foundChannelsMode}`}>
                <p onClick={() => { ExpandAndHide(foundChannelsMode, setFoundChannelsMode, foundUsersMode, setFoundUsersMode) }}>Channels:</p>
                <div className={`Inner`} >
                    {foundData && foundData.Channels && foundData.Channels.length > 0 ? (
                        foundData.Channels.map((item) => {
                            return <ChannelCard key={item.Id} item={item} func={JoinChannel} />;
                        })
                    ) : (
                        <>empty</>
                    )}
                </div>
            </div>
        );
    }, [foundChannelsMode, setFoundChannelsMode, foundUsersMode, setFoundUsersMode, foundData]);


    useEffect(() => {
        if (fieldInput === "") {
            setFoundData(null);
            return;
        }
        if (listMode === "Search" && fieldInput !== "") {

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            const timeout = setTimeout(() => {
                searchChats(connection, fieldInput)
                    .then((response) => {
                        setFoundData(JSON.parse(response));
                    })
                    .catch((error) => {
                        console.error('fail ', error);
                    });
            }, 1000);

            setTimeoutId(timeout);
        }
    }, [fieldInput]);

    useEffect(() => {
        if (fieldInput === "") {
            setFoundData(null);
            return;
        }
    }, [fieldInput, foundData]);


    return (
        <>
            
            <div className="ListWrapper">
                <div className="Bar">
                    <input type="text" className="BarField" onChange={(e) => setFieldInput(e.target.value)} value={fieldInput}></input>
                    <div className="BarBtns">
                        <button className={`btn ${listMode === "Filter" ? "active" : ""}`} onClick={() => { setListMode("Filter"); setFieldInput("") }}>List </button>
                        <button className={`btn ${listMode === "Search" ? "active" : ""}`} onClick={() => { setListMode("Search"); setFieldInput("") }}>Search </button>
                    </div>
                </div>
                <div className="List">
                    {chatData && listMode === "Filter" ? (
                        chatCards
                    ) : listMode === "Search" ? (
                        <>
                            {foundUsersSection}
                            {foundChannelsSection}
                        </>
                    ) : (
                        <div>empty</div>
                    )}
                </div>
            </div>
        </>
    );
}
export default ChatList;