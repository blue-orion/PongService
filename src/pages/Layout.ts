import { Component } from "../components/Component";
import { FriendComponent } from "../components/friend/FriendComponent";
import { HeaderComponents } from "../components/header/HeaderComponents";
import "../styles/main.css";

export class Layout extends Component {
  private headerComponent: HeaderComponents | null = null;
  private friendComponent: FriendComponent | null = null;
  private mainComponent: any = null;

  constructor(container: HTMLElement) {
    super(container);
  }

  setMainComponent(component: any): void {
    if (this.mainComponent) {
      this.mainComponent.destroy();
    }
    this.mainComponent = component;
  }

  private getTemplate(): string {
    return `
					<div id="layout" class="layout-container">
							<header id="header" class="header-section">
								<!-- 헤더 템플릿 -->
							</header>
							<div class="body-section">
								<main id="main-content" class="main-section">
									<!-- 메인 콘텐츠 영역 -->
								</main>
								<div id="friend-container">
									<!-- 친구 목록 템플릿 -->
								</div>
							</div>
						</div>
        `;
  }

  async render(): Promise<void> {
    this.clearContainer();

    console.log("Layout 렌더링 시작...");

    // 기본 레이아웃 구조 템플릿에서 로드
    await this.createDefaultLayout();
    await this.initializeComponents();
  }

  private async createDefaultLayout(): Promise<void> {
    console.log("기본 레이아웃 생성 중...");

    this.container.innerHTML = this.getTemplate();
  }

  private async initializeComponents(): Promise<void> {
    const headerContainer = this.container.querySelector("#header") as HTMLElement;
    const friendsContainer = this.container.querySelector("#friend-area") as HTMLElement;

    if (headerContainer) {
      this.headerComponent = new HeaderComponents(headerContainer);
      await this.headerComponent.render();
    }

    if (friendsContainer) {
      this.friendComponent = new FriendComponent(friendsContainer);
      await this.friendComponent.render();
    }
  }

  destroy(): void {
    if (this.headerComponent) {
      this.headerComponent.destroy();
    }
    if (this.friendComponent) {
      this.friendComponent.destroy();
    }
    if (this.mainComponent) {
      this.mainComponent.destroy();
    }
    this.clearContainer();
  }
}
