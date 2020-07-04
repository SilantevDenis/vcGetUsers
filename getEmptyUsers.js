//////////////////////////////// модули ////////////////////////////////////////////////
// запросы
const request = require('request');

// логгирование
const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logFilePath:'logGetEmptyUsers.log',
        timestampFormat:'DD.MM HH:mm:ss.SSS'
    },
log = SimpleNodeLogger.createSimpleLogger( opts );

// подключение к БД
const mysql   = require('mysql2');
const { DATE } = require('mysql2/lib/constants/types');


////////////////////////////////// настройки ///////////////////////////////
const pool = mysql.createPool({
  charset: "utf8mb4_bin", // формат базы данных (рекомендовано utf8mb4_bin для сохранения смайликов)
  host: 'localhost',      // расположение БД
  user: 'root',           // имя пользователя
  password: '',           // пароль ползователя
  database: 'vc',         // имя БД
  waitForConnections: true,
  connectionLimit: 0,
  queueLimit: 0
});


// токен для подключения к vc (есть в личном кабинете)
const token = ''; 


// прокручиваем цикл с задержкой
let i     = 0;      // начало отсчета (с какого номера пользователя начать загружать)
let count;          // повторений (предполагаемое количество пользователей в базе)
let delay = 251;    // задержка (vc просит не больше 3 запросов в секунду)
let ids;            // id, которые нужно загрузить






//////////////////////////////////////// скрипт /////////////////////////////////////////////////

log.info('Старт скрипта');

// подготавливаем запрос на пропущенные id 
const query = "SELECT (`users`.`id_vc`+1) as `empty_user` "+
                "FROM `users` "+
                "WHERE ( "+
                "    SELECT 1 FROM `users` as `st` WHERE `st`.`id_vc` = (`users`.`id_vc` + 1) "+
                ") IS NULL "+
                "ORDER BY `users`.`id_vc` "+
                "";


// получаем отсутствующие значения
pool.query(query, function(err, result){

    if(err) log.info("Ошибка при получении пользователя "+err)
    else{
        // записываем id пользователей
        ids = result;
        // сколько их всего
        count = result.length
        // отчитываемся
        log.info("Получили "+count+" пользователей")
        // запускаем цикл 
        looper()
    }
    
})







// повторение с задержкой
function looper() {

  // вместо for  
  if (i < count) {

    // прибавляем счетчик
    i++;
    // отчет
    log.info('Цикл с i='+i+' id_vc='+ids[i].empty_user)

    // вызываем следующие действие
    looperCallback(i, ()=>{
        // задержка
        setTimeout(() => {
            // перезапускаем цикл
            looper()
        }, delay);
    })

  } else {
    // отчет
    log.info('Цикл завершен')
    // функция завершения
    return looperEndCallback
  } 

};





function looperCallback(i, ready){

    // запрос пользователя
    let reqOptions = {
        url: 'https://api.vc.ru/v1.8/user/'+ids[i].empty_user,
        headers: {
        'User-Agent': 'request',
        'X-Device-Token': token
        }
    };
  
    // запрос 
    request(reqOptions, (error, response, body) => {
        // проверка на ошибочки
        if (!error && response.statusCode == 200) {
    
            // отчет 
            //log.info('Ответ получен status=200, записываем пользователя')
    
            // пробразовываем ответ в json
            const user = JSON.parse(body).result;
            // записываем значения
            const userValues = [
                    user.id,
                    user.name,
                    user.url,
                    user.avatar_url,
                    user.description,
                    user.type,
                    user.subscribers_count,
                    user.counters.comments,
                    user.counters.entries,
                    user.created,
                    user.createdRFC,
                    user.karma,
                    user.site_url,
                    user.email,
                    user.contacts
                ]
            // формируем запрос
            let sql = "INSERT INTO users(id_vc, name, url, avatar_url, description, type, subscribers, comments, entries, created_vc, createdRFC, karma, site_url, email, contacts )"+
                      "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                
            pool.query(sql, userValues, function(err, results) {
    
                // считаем удаченые и неудачные записи
                if(err) log.info("User "+JSON.stringify(user)+" SQL "+sql+" "+err)
                else    log.info('Успешная запись') 
    
                // сообщаем, что все готово
                ready()
    
            });// end query
      
         
        }else{
          // отчет 
          log.info('Ответ получен произошла ошбка: '+ body)
    
            // // немного подождем
            // setTimeout(()=>{
                // говорим, что все готово
                ready()
            // }, 10000)
            
        }
      
    })
}


// цикл завершен
function looperEndCallback(){
    // разрываем соединение
    return pool.end()
}


