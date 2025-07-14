class User {
  constructor({ id, username, passwd, profile_image, refresh_token, created_at, updated_at, enabled }) {
    this.id = id;
    this.username = username;
    this.passwd = passwd;
    this.profile_image = profile_image;
    this.refresh_token = refresh_token;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.enabled = enabled;
  }
}

export default User;
