
async function PostDataOnFirebase() {
    const data = GetData();
    // Ждем завершения записи данных в Firebase
    const res await fetch('/api/post', {
        method: "POST",
        headers: {"Content-Type": "application/json",},
        body: JSON.stringify(data),
    });

    if (res.ok) {
        alert("Data had been posted to Firebase");
    } else { alert("Error posting data to Firebase"); }
    // Обновляем данные после успешной записи
    await GetDataFromFirebase();
}

GetDataFromFirebase();

let allData = [];

function GetData(){
  const popis = document.getElementById("description").value;
  const hodnota = document.getElementById("amount").value;
  const datum = document.getElementById("date").value;
  const categorie = document.getElementById("category").value;

  return {
    popis: popis,
    hodnota: hodnota,
    datum: datum,
    categorie: categorie
  }
}

async function GetDataFromFirebase() {
    const res = await fetch('/api/get');
    const data = await res.data.json(); // Получаем данные

    if (!data) {
        console.log("No data found");
        allData = [];
        UploadBalance();
        DisplayTransactions();
        RenderChart(); // Обновляем график
        return;
    }

    allData = ConverDataToArray(data);
    UploadBalance();
    DisplayTransactions();
    RenderChart(); // Обновляем график
}

function ConverDataToArray(data) {
    let dataArray = [];

    const keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = data[key];

        const polozka = {
            key: key, // Сохраняем ключ для удаления/изменения
            discription: value.popis || "Žádný popis",
            amount: parseFloat(value.hodnota) || 0,
            date: value.datum || "Není uvedeno",
            category: value.categorie || "Není uvedeno",
        };

        dataArray.push(polozka);
    }

    return dataArray;
}

// masiv = [polozka1, polozka2, polozka3]
// kazda polozka = {discription: "popis", amount: 100, date: "2023-10-01", category: "food"}
//
function UploadBalance() {
    const element = document.getElementById("balance");
    let balance = 0; // Начальный баланс

    for (let i = 0; i < allData.length; i++) {
        const amount = parseFloat(allData[i].amount); // Преобразуем сумму в число
        if (!isNaN(amount)) { // Проверяем, что значение корректное
            balance += amount;
        }
    }

    element.textContent = balance.toFixed(2); // Обновляем текст баланса с двумя знаками после запятой
}


function DisplayTransactions() {
    const tableBody = document.getElementById("transaction-list");
    tableBody.innerHTML = ""; // Очищаем таблицу перед добавлением новых данных

    for (let i = 0; i < allData.length; i++) {
        const { discription, amount, date, category } = allData[i];

        // Создаем строку таблицы
        const row = document.createElement("tr");

        // Создаем ячейки для каждой колонки
        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = discription;

        const amountCell = document.createElement("td");
        const sign = amount >= 0 ? "+" : "-";
        amountCell.textContent = `${sign}${Math.abs(amount)} Kč`;
        amountCell.style.color = amount >= 0 ? "green" : "red";

        const dateCell = document.createElement("td");
        dateCell.textContent = date;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = category;

        // Создаем ячейку для кнопок
        const actionsCell = document.createElement("td");

        // Кнопка "Удалить"
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Smazat";
        deleteButton.className = "btn btn-delete"; // Добавляем классы
        deleteButton.onclick = () => DeleteTransaction(i);
        actionsCell.appendChild(deleteButton);

        // Кнопка "Изменить"
        const editButton = document.createElement("button");
        editButton.textContent = "Změnit";
        editButton.className = "btn btn-edit"; // Добавляем классы
        editButton.onclick = () => EditTransaction(i);
        actionsCell.appendChild(editButton);

        // Добавляем ячейки в строку
        row.appendChild(descriptionCell);
        row.appendChild(amountCell);
        row.appendChild(dateCell);
        row.appendChild(categoryCell);
        row.appendChild(actionsCell);

        // Добавляем строку в начало таблицы
        tableBody.insertBefore(row, tableBody.firstChild);
    }
}

async function DeleteTransaction(index) {
    const key = allData[index].key; // Получаем ключ транзакции из массива allData
    const res =  await fetch('/api/delete', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(key) // Отправляем ключ транзакции на сервер
    })

    if(res.ok){
        alert("Transakce byla úspěšně odstraněna.");
        await GetDataFromFirebase(); // Обновляем данные после удаления
    }else{
        alert("Chyba při mazání transakce.");
    }
}

function EditTransaction(index) {
    const transaction = allData[index]; // Получаем данные транзакции
    const key = transaction.key; // Получаем ключ транзакции

    // Заполняем форму значениями транзакции
    document.getElementById("description").value = transaction.discription;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("date").value = transaction.date;
    document.getElementById("category").value = transaction.category;

    // Удаляем старую транзакцию
     DeleteTransaction(index);
}

async function GetDataFromFirebase() {
    const res = await fetch('api/get');
    const data = await res.json(); // Получаем данные

    if (!data) {
        console.log("No data found");
        allData = [];
        UploadBalance();
        DisplayTransactions();
        RenderChart(); // Обновляем график
        return;
    }

    allData = ConverDataToArray(data);
    UploadBalance();
    DisplayTransactions();
    RenderChart(); // Обновляем график
}

  

function RenderChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');

    // Создаем объект для хранения расходов по категориям
    const categoryExpenses = {};

    for (let i = 0; i < allData.length; i++) {
        const { amount, category } = allData[i];
        const expense = parseFloat(amount);

        // Учитываем только расходы (отрицательные суммы)
        if (expense < 0) {
            if (!categoryExpenses[category]) {
                categoryExpenses[category] = 0;
            }
            categoryExpenses[category] += Math.abs(expense); // Суммируем расходы по категории
        }
    }

    // Преобразуем объект в массив для графика
    const labels = Object.keys(categoryExpenses); // Категории
    const data = Object.values(categoryExpenses); // Суммы расходов

    // Уничтожаем предыдущий график, если он существует
    if (window.expenseChart) {
        window.expenseChart.destroy();
    }

    // Создаем новый график
    window.expenseChart = new Chart(ctx, {
        type: 'doughnut', // Тип графика (круговая диаграмма)
        data: {
            labels: labels, // Категории
            datasets: [{
                label: 'Výdaje podle kategorií',
                data: data, // Суммы расходов
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#F44336', '#9C27B0'
                ], // Цвета для каждой категории
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw} Kč`;
                        }
                    }
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("date");
    const today = new Date().toISOString().split("T")[0]; // Получаем текущую дату в формате YYYY-MM-DD
    dateInput.value = today; // Устанавливаем значение поля даты
});
