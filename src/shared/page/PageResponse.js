class PageResponse {
  constructor(content, page, size, totalElements, first, last) {
    this.content = content;
    this.page = page;
    this.size = size;
    this.totalElements = totalElements;
    this.totalPages = Math.ceil(totalElements / size);
    this.first = first;
    this.last = last;
  }

  static of(pageRequest, content = [], totalElements = 0) {
    const page = Math.floor(pageRequest.skip / pageRequest.take) + 1;
    const size = pageRequest.take;
    const first = pageRequest.skip === 0;
    const totalPages = Math.ceil(totalElements / size);
    const last = page >= totalPages;
    
    return new PageResponse(content, page, size, totalElements, first, last);
  }
}

export default PageResponse;
