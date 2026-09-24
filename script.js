/* ==========================================
   POCKETSMART AI
   FRONTEND JAVASCRIPT
========================================== */


/* ==========================================
   CURRENCY
========================================== */

function formatCurrency(amount) {

    return "₹" + Number(amount).toLocaleString("en-IN");

}


/* ==========================================
   CALCULATIONS
========================================== */

function getTotalExpenses() {

    return budgetData.expenses.reduce(

        function(total, expense) {

            return total + Number(expense.amount);

        },

        0

    );

}


function getRemainingBalance() {

    return (
        Number(budgetData.income) -
        getTotalExpenses()
    );

}


/* ==========================================
   INCOME
========================================== */

function setIncome() {

    const input =
        document.getElementById("income");

    const income =
        Number(input.value);


    if (income <= 0) {

        alert(
            "Please enter a valid income."
        );

        return;
    }


    budgetData.income = income;

    saveData();

    updateDashboard();

    alert(
        "Monthly income saved successfully."
    );

}


/* ==========================================
   SAVINGS GOAL
========================================== */

function setSavingsGoal() {

    const input =
        document.getElementById(
            "savingsGoal"
        );

    const goal =
        Number(input.value);


    if (goal <= 0) {

        alert(
            "Please enter a valid savings goal."
        );

        return;
    }


    budgetData.savingsGoal = goal;

    saveData();

    updateDashboard();

    alert(
        "Savings goal saved successfully."
    );

}


/* ==========================================
   ADD EXPENSE
========================================== */

function addExpense() {

    const category =
        document.getElementById(
            "category"
        ).value;


    const amount =
        Number(
            document.getElementById(
                "amount"
            ).value
        );


    if (amount <= 0) {

        alert(
            "Please enter a valid expense amount."
        );

        return;
    }


    const expense = {

        category: category,

        amount: amount,

        date:
            new Date().toLocaleDateString(
                "en-IN"
            )

    };


    budgetData.expenses.push(expense);


    document.getElementById(
        "amount"
    ).value = "";


    saveData();

    updateDashboard();

    displayExpenses();

}


/* ==========================================
   DASHBOARD
========================================== */

function updateDashboard() {

    const total =
        getTotalExpenses();


    const remaining =
        getRemainingBalance();


    document.getElementById(
        "incomeDisplay"
    ).textContent =
        formatCurrency(
            budgetData.income
        );


    document.getElementById(
        "expenseDisplay"
    ).textContent =
        formatCurrency(total);


    document.getElementById(
        "remainingDisplay"
    ).textContent =
        formatCurrency(remaining);


    document.getElementById(
        "savingDisplay"
    ).textContent =
        formatCurrency(
            budgetData.savingsGoal
        );

}


/* ==========================================
   EXPENSE DISPLAY
========================================== */

function displayExpenses() {

    const list =
        document.getElementById(
            "expenseList"
        );


    list.innerHTML = "";


    if (
        budgetData.expenses.length === 0
    ) {

        list.innerHTML = `
            <p class="empty">
                No expenses added yet.
            </p>
        `;

        return;
    }


    budgetData.expenses.forEach(
        function(expense) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "expense-item";


            item.innerHTML = `

                <div>

                    <div class="expense-category">
                        ${escapeHTML(
                            expense.category
                        )}
                    </div>

                    <span class="expense-date">
                        ${expense.date}
                    </span>

                </div>

                <div class="expense-amount">
                    ${formatCurrency(
                        expense.amount
                    )}
                </div>

            `;


            list.appendChild(item);

        }
    );

}


/* ==========================================
   CLEAR EXPENSES
========================================== */

function clearExpenses() {

    if (
        !confirm(
            "Are you sure you want to delete all expenses?"
        )
    ) {

        return;
    }


    budgetData.expenses = [];

    saveData();

    updateDashboard();

    displayExpenses();

}


/* ==========================================
   PREPARE DATA FOR GEMINI
========================================== */

function getFinancialData() {

    return {

        income:
            budgetData.income,

        totalExpenses:
            getTotalExpenses(),

        remaining:
            getRemainingBalance(),

        savingsGoal:
            budgetData.savingsGoal,

        expenses:
            budgetData.expenses

    };

}


/* ==========================================
   ASK GEMINI
========================================== */

async function askGemini() {

    const question =
        document.getElementById(
            "aiQuestion"
        ).value.trim();


    if (!question) {

        alert(
            "Please enter a question first."
        );

        return;
    }


    const responseBox =
        document.getElementById(
            "aiResponse"
        );


    responseBox.innerHTML = `
        <p>
            ✨ Gemini is analyzing your
            financial information...
        </p>
    `;


    try {

        const response =
            await fetch(
                "/api/advice",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            question:
                                question,

                            financialData:
                                getFinancialData()

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Gemini request failed."
            );

        }


        responseBox.innerHTML =
            formatAIResponse(
                data.answer
            );


    } catch (error) {

        console.error(error);


        responseBox.innerHTML = `

            <p>
                ❌ ${escapeHTML(
                    error.message ||
                    "Unable to connect to Gemini."
                )}
            </p>

            <p>
                Check that the backend server
                is running, then try again.
            </p>

        `;

    }

}


/* ==========================================
   CAN I AFFORD IT?
========================================== */

async function checkPurchase() {

    const name =
        document.getElementById(
            "purchaseName"
        ).value.trim();


    const amount =
        Number(
            document.getElementById(
                "purchaseAmount"
            ).value
        );


    const result =
        document.getElementById(
            "purchaseResult"
        );


    if (!name || amount <= 0) {

        alert(
            "Enter the purchase name and amount."
        );

        return;
    }


    result.innerHTML = `
        ✨ Gemini is checking whether
        this purchase fits your budget...
    `;


    const question = `

I want to buy ${name}
for ₹${amount}.

Analyze whether this purchase
fits my current budget.

Consider:
- My current remaining balance
- My savings goal
- My total expenses
- Whether this purchase could affect
  my savings goal

Give me a clear explanation and
suggest a safer alternative if appropriate.

`;


    try {

        const response =
            await fetch(
                "/api/advice",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            question:
                                question,

                            financialData:
                                getFinancialData()

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error
            );

        }


        result.innerHTML =
            formatAIResponse(
                data.answer
            );


    } catch (error) {

        console.error(error);


        result.textContent =
            `❌ ${
                error.message ||
                "Unable to connect to Gemini."
            }`;

    }

}


/* ==========================================
   QUICK QUESTIONS
========================================== */

function quickQuestion(question) {

    document.getElementById(
        "aiQuestion"
    ).value = question;


    askGemini();

}


/* ==========================================
   FORMAT AI RESPONSE
========================================== */

function formatAIResponse(text) {

    let safeText =
        escapeHTML(text);


    safeText =
        safeText.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    safeText =
        safeText.replace(
            /\n/g,
            "<br>"
        );


    return `<p>${safeText}</p>`;

}


/* ==========================================
   SECURITY
========================================== */

function escapeHTML(text) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        text;


    return element.innerHTML;

}


/* ==========================================
   LOCAL STORAGE
========================================== */

function saveData() {

    localStorage.setItem(

        "pocketSmartData",

        JSON.stringify(
            budgetData
        )

    );

}


function loadData() {

    const saved =
        localStorage.getItem(
            "pocketSmartData"
        );


    if (!saved) {

        return;

    }


    try {

        const data =
            JSON.parse(saved);


        budgetData.income =
            Number(data.income) || 0;


        budgetData.savingsGoal =
            Number(
                data.savingsGoal
            ) || 0;


        budgetData.expenses =
            Array.isArray(
                data.expenses
            )
                ? data.expenses
                : [];


    } catch (error) {

        console.error(
            "Could not load saved data.",
            error
        );

    }

}


/* ==========================================
   START APPLICATION
========================================== */

loadData();

updateDashboard();

displayExpenses();


if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register("./sw.js")
                .catch(console.error);

        }
    );

}
