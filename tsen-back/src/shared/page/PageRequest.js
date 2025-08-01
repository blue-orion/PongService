class PageRequest {
  constructor(skip, take, filters = {}) {
    this.skip = skip;
    this.take = take;
    this.filters = filters;
  }

  static of(query = {}, defaultPage = 1, defaultSize = 10) {
    const page = query.page ? Number(query.page) : defaultPage;
    const size = query.size ? Number(query.size) : defaultSize;
    const skip = (page - 1) * size;
    const take = size;

    // 필터 파라미터 추출
    const filters = {};
    Object.keys(query).forEach(key => {
      if (!['page', 'size'].includes(key)) {
        filters[key] = query[key];
      }
    });

    return new PageRequest(skip, take, filters);
  }

  orderBy(sort, order = "desc") {
    this.sort = sort;
    this.order = order;
    return this;
  }

  hasFilter(key) {
    return this.filters.hasOwnProperty(key);
  }

  getFilter(key) {
    return this.filters[key];
  }
}

export default PageRequest;
