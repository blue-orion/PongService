import { Component } from "../Component";
import { loadTemplate, TEMPLATE_PATHS } from "../../utils/template-loader";

export class FriendsListComponent extends Component {
    constructor(container: HTMLElement) {
        super(container);
    }

    async render(): Promise<void> {
        this.clearContainer();
        
        console.log('친구리스트 컴포넌트 렌더링 시작...');
        const template = await loadTemplate(TEMPLATE_PATHS.FRIENDS_LIST);
        this.container.innerHTML = template
        
        this.setupEventListeners();
        console.log('친구리스트 컴포넌트 렌더링 완료');
    }

    private setupEventListeners(): void {
        // 친구 클릭 이벤트
        const friendItems = this.container.querySelectorAll('.friend-item');
        friendItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const friendName = target.querySelector('.friend-name')?.textContent;
                console.log('친구 선택:', friendName);
                
                // 친구와 채팅 시작 또는 게임 초대 등의 기능 추가 가능
                this.showFriendMenu(target, friendName || '');
            });
        });

        // 친구 추가 버튼 이벤트
        const addFriendBtn = this.container.querySelector('.add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                this.showAddFriendDialog();
            });
        }
    }

    private showFriendMenu(friendElement: HTMLElement, friendName: string): void {
        // 친구 메뉴 표시 (채팅, 게임 초대 등)
        console.log(`${friendName}와의 상호작용 메뉴`);
    }

    private showAddFriendDialog(): void {
        // 친구 추가 다이얼로그 표시
        const friendId = prompt('추가할 친구의 ID를 입력하세요:');
        if (friendId) {
            console.log('친구 추가 요청:', friendId);
            // 실제 친구 추가 로직 구현
        }
    }

    destroy(): void {
        this.clearContainer();
    }
}
