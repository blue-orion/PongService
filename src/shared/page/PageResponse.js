class PageResponse {
  constructor(content, size, first, last) {
    this.content = content;
    this.size = size;
    this.first = first;
    this.last = last;
  }

  static of(pageable, content = []) {
    const size = pageable.take;
    const first = pageable.skip === 0;
    const last = content.length !== size;
    return new PageResponse(content, size, first, last);
  }
}

export default PageResponse;
