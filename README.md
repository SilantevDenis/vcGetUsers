# vcGetUsers
Стек: Node.js, mySQL. Скрипт getUsers.js скачивает пользоватлей, getEmptyUsers.js скачивает неостающих в БД пользователей.

<h2>Установка</h2> 
<ol>
  <li>Скачайте проект</li>
  <li>Импортируйте базу данных (файл vc_sructure.sql) в mysql</li>
  <li>Установите модули <code>npm init</code></li>
  <li>
    Напишите свой токен в файлы getUsers.js и getEmptyUsers.js. Токен можно взять в личном кабинете vc.ru в разделе "для разработчика" 
    <code>
      const token = '';
    </code>
  </li>
  <li>Запустите скрипт <code>node getUsers.js</code>. Начнется скачивание пользователей.</li>
</ol>
