class PageRequest {
  constructor(skip, take) {
    this.skip = skip;
    this.take = take;
  }

  static of(query = {}, defaultPage = 1, defaultSize = 10) {
    const page = query.page ? Number(query.page) : defaultPage;
    const size = query.size ? Number(query.size) : defaultSize;
    const skip = (page - 1) * size;
    const take = size;

    return new PageRequest(skip, take);
  }

  orderBy(sort, order = "desc") {
    this.sort = sort;
    this.order = order;
    return this;
  }
}

export default PageRequest;
