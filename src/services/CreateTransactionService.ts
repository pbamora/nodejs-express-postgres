import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepo = getCustomRepository(TransactionsRepository);
    const categoryRepo = getRepository(Category);

    // pegamos o total das nossas transações
    const { total } = await transactionRepo.getBalance();

    // verificamos se o valor de saída é maior do que o valor total
    // disponível no nosso saldo
    if (type === 'outcome' && total < value) {
      throw new AppError('You dont have money for pay this!');
    }

    // procuramos para ver se a categoria que nos foi passada na rota
    // realmente existe
    let categoryExists = await categoryRepo.findOne({
      where: {
        title: category,
      },
    });

    // se a categoria não existir, nós criamos uma nova categoria
    if (!categoryExists) {
      categoryExists = categoryRepo.create({
        title: category,
      });

      await categoryRepo.save(categoryExists);
    }

    // agora criamos uma instancia da transação
    // passando title, value, type e a categoryExists
    const transaction = transactionRepo.create({
      title,
      value,
      type,
      category: categoryExists,
    });

    // salvamos ela no banco de dados
    await transactionRepo.save(transaction);

    // retornamos ela por ultimo
    return transaction;
  }
}

export default CreateTransactionService;
