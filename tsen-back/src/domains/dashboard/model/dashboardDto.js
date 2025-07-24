class DashboardDto {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.nickname = user.nickname;
    this.profile_image = user.profile_image;
    this.total_wins = user.total_wins;
    this.total_losses = user.total_losses;
    this.win_rate = user.win_rate;
  }
}

export default DashboardDto;
