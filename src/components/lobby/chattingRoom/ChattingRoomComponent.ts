import { Component } from "../../Component";

export class ChattingRoomComponent extends Component {
    constructor(container: HTMLElement) {
        super(container);
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('채팅룸 컴포넌트 렌더링 시작...');
        
        // 템플릿 로딩 대신 직접 HTML 생성
        this.container.innerHTML = `
            <div class="chatting-room">
                <div class="chat-header">
                    <h3>💬 채팅</h3>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="message">
                        <span class="message-user">사용자1:</span>
                        <span class="message-text">안녕하세요!</span>
                    </div>
                    <div class="message">
                        <span class="message-user">사용자2:</span>
                        <span class="message-text">게임 하실래요?</span>
                    </div>
                    <div class="message">
                        <span class="message-user">나:</span>
                        <span class="message-text">좋아요! 시작해봐요~</span>
                    </div>
                </div>
                <div class="chat-input">
                    <input type="text" id="chat-input" placeholder="메시지를 입력하세요..." />
                    <button id="send-button">전송</button>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        console.log('채팅룸 컴포넌트 렌더링 완료');
    }

    private setupEventListeners(): void {
        const sendButton = this.container.querySelector('#send-button');
        const chatInput = this.container.querySelector('#chat-input') as HTMLInputElement;
        const chatMessages = this.container.querySelector('#chat-messages');

        if (sendButton && chatInput && chatMessages) {
            const sendMessage = () => {
                const message = chatInput.value.trim();
                if (message) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message';
                    messageElement.textContent = `나: ${message}`;
                    chatMessages.appendChild(messageElement);
                    chatInput.value = '';
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            };

            sendButton.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    }

    destroy(): void {
        this.clearContainer();
    }
}
