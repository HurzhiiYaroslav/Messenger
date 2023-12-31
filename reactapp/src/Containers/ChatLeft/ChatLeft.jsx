import React, { useEffect, useState } from 'react';
import { AvatarUrl, EditProfileUrl, CreateChatUrl } from '../../Links';
import ChatList from '../../Components/ChatList/ChatList'
import DoYouWantModal from "../../Components//Modals/DoYouWantModal/DoYouWantModal";
import CreateChatModal from "../../Components//Modals/CreateChatModal/CreateChatModal";
import EditProfileModal from "../../Components//Modals/EditProfileModal/EditProfileModal";
import "./ChatLeft.scss"
import EditOverlay from '../../Components/EditOverlay/EditOverlay';

function ChatLeft({ connection, chatData, setChatData, onlineUsers, currentChatId, setCurrentChatId, navigate }) {
    const [logoutModal, setLogoutModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [newChatModal, setNewChatModal] = useState(false);


    function handleLogoutModal() {
        setLogoutModal(!logoutModal);
    }

    function handleLogout() {

        localStorage.clear();
        handleLogoutModal();
        connection.stop();
        navigate("/login", { replace: true });
    }

    function handleEditModal() {
        setEditModal(!editModal);
    }

    function handleNewChatModal() {
        setNewChatModal(!newChatModal);
    }

    return (
        <>
            <DoYouWantModal
                closeModal={handleLogoutModal}
                open={logoutModal}
                action={handleLogout}
                text={`to logout`}
            />

            <CreateChatModal open={newChatModal} close={handleNewChatModal} setChatData={setChatData} connection={connection} setCurrentChatId={setCurrentChatId } />
            <EditProfileModal open={editModal} close={handleEditModal} />

            <div className="leftSide">
                <div className="ButtonsWrapper">
                    <button className="logoutButton" onClick={() => { handleLogoutModal() }}>Logout</button>
                </div>
                <div className="UserInfo">
                    <div className="UserPhotoWrapper">
                        <EditOverlay func={handleEditModal } />
                        <img
                            className="UserPhoto"
                            src={AvatarUrl + (chatData?.user?.Photo || "default")}
                            alt="YourAvatar"
                        />
                    </div>
                    <div className="UserName">
                        { chatData.user.Name ? chatData.user.Name : "name"}
                    </div>
                </div>

                <ChatList connection={connection}
                    chatData={chatData}
                    onlineUsers={onlineUsers}
                    setCurrentChatId={setCurrentChatId}
                    currentChatId={currentChatId }/>
                <button className="newChatButton" onClick={handleNewChatModal }>+</button>
            </div>
        </>
    );
}

export default ChatLeft;