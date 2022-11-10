const EnemyDTO = require('./EnemyDTO');
const PlayerDTO = require('./PlayerDTO');
const {
  Sequelize,
  sequelize,
  Enemy,
  Game,
  Player,
  PlayerSkin,
} = require('../db/models/index');

const GameDTO = require('./GameDTO');

class Repository {
  /**  метод возвращает массив всех врагов */
  async getAllEnemies() {
    const allEnem = await Enemy.findAll({
      attributes: ['skin', 'base_tick', 'strong'],
      raw: true,
    });
    return allEnem.map((el) => new EnemyDTO(el.skin, el.base_tick, el.strong));
  }

  /** метод возвращает данные игрока(или создает его, если нет) */
  async getOrCreatePlayer(playerName) {
    const [player, created] = await Player.findOrCreate({
      attributes: ['name'],
      include: {
        model: PlayerSkin,
        attributes: ['skin'],
      },
      where: { name: playerName },
      defaults: {
        skin_id: 1,
      },
      raw: true,
    });
    // console.log(player, created);
    if (created) {
      await Game.create({
        score: 0,
        enemies_killed: 0,
        player_id: player.id,
      });
      const newPlayer = Player.findAll({
        attributes: ['name'],
        include: {
          model: PlayerSkin,
          attributes: ['skin'],
        },
        where: { name: playerName },
      });
      return new PlayerDTO(newPlayer.name, newPlayer['PlayerSkin.skin']);
    }
    return new PlayerDTO(player.name, player['PlayerSkin.skin']);
  }

  /** метод для записи результатов игры в БД */
  async recordNewResult(namePlayer, newScore, newKilled) {
    const idPlayer = await Player.findAll({
      attributes: ['id'],
      where: {
        name: namePlayer,
      },
      raw: true,
    });

    await Game.create({
      score: newScore,
      enemies_killed: newKilled,
      player_id: idPlayer[0].id,
    });
  }

  /** метод возвращающий статистику по всем играм игрока */
  async getAllGamesOfPlayer(namePlayer) {
    const idPlayer = await Player.findAll({
      attributes: ['id'],
      where: {
        name: namePlayer,
      },
      raw: true,
    });
    const res = await Game.findAll({
      attributes: ['score', 'enemies_killed'],
      order: [['createdAt', 'DESC']],
      where: {
        player_id: idPlayer[0].id,
      },
      raw: true,
    });
    //console.log(res);
    return res.map((el) => new GameDTO(el.score, el.enemies_killed));
  }
}

const rep = new Repository();
rep.getAllGamesOfPlayer('Naida');
module.exports = Repository;
