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
    // pegamos o caminho do arquivo
    const contactsReadStream = fs.createReadStream(filePath);
    const categoriesRepo = getRepository(Category);
    const transactionRepo = getCustomRepository(TransactionsRepository);

    // utilizamos a lib csvPase para ignorar a primeira linha (título)
    const parses = csvParse({
      from_line: 2,
    });

    // Agora de fato ignoramos a linha do arquivo passado
    const parseCsv = contactsReadStream.pipe(parses);

    // criamos um array para armazenar temporariamente os dados na memoria
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

    // como o metodo parseCsv.on não é sincrono utilizamos uma promise até que ela seja resolvida
    await new Promise(resolve => parseCsv.on('end', resolve));

    // Próximo passo é verificar se as categorias que estão na memoria
    // já existem no banco de dados, e utilizamos o titulo para isso
    const existentCategories = await categoriesRepo.find({
      where: {
        title: In(categories),
      },
    });

    // mapegamos as categorias para pegar somente o título delas
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
