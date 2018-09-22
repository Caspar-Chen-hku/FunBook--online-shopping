###########FunBooks############
########author: Chen Cheng#####

Some special notes:
1. A special "bookId" is used for everybook, instead of the automatically obtained _id. "bookId" is an integer starting from one. If a new book is to be inserted, make sure bookId doesn't contradict to any other books
2. For bookCollection, the "price" field is a string like "$xx" instead of an integer
2. There are two users in the system, "Caspar" with password "654321" and "Henry" with password "123456".
3. There are 3 categories of books, when the page is initially loaded, the default category to be displayed is "Computer". Every page can display at most 8 books
