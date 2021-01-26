import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVtransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const contactsReadStream = fs.createReadStream(filePath);
    const categoriesRepo = getRepository(Category);
    const transactionRepo = getCustomRepository(TransactionsRepository);

    const parses = csvParse({
      from_line: 2,
    });

    const parseCsv = contactsReadStream.pipe(parses);

    const transactions: CSVtransaction[] = [];
    const categories: string[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    const existentCategories = await categoriesRepo.find({
      where: {
        title: In(categories),
      },
    });

    const categoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter((category: string) => !categoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepo.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepo.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createTransaction = transactionRepo.create(
      transactions.map(t => ({
        title: t.title,
        type: t.type,
        value: t.value,
        category: finalCategories.find(
          category => category.title === t.category,
        ),
      })),
    );

    await transactionRepo.save(createTransaction);

    await fs.promises.unlink(filePath);

    return createTransaction;
  }
}

export default ImportTransactionsService;
