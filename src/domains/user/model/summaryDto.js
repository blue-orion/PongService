class SummaryDto {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.nickname = user.nickname;
    this.profileImage = user.profile_image;
    this.totalWins = user.total_wins;
    this.totalLosses = user.total_losses;
    this.winRate = user.win_rate;
  }
}

export default SummaryDto;
