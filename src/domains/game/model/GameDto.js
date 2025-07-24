export default class GameDto {
  constructor(game) {
    this.game = {
      id: game.id,
      tournament_id: game.tournament_id,
      winner: game.winner,
      winner_id: game.winner_id,
      loser: game.loser,
      loser_id: game.loser_id,
      player_one_id: game.player_one_id,
      player_one: game.player_one,
      player_one_score: game.player_one_score,
      player_two_id: game.player_two_id,
      player_two: game.player_two,
      player_two_score: game.player_two_score,
      play_time: game.play_time,
      round: game.round,
      match: game.match,
    }
  }
}
