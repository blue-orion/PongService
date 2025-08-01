// 컴포넌트 기본 인터페이스
export abstract class Component {
  protected container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  // 컴포넌트 렌더링 (비동기 지원)
  abstract render(): void | Promise<void>;

  // 컴포넌트 정리
  abstract destroy(): void;

  // 컨테이너 내용 클리어
  protected clearContainer(): void {
    this.container.innerHTML = "";
  }
}
