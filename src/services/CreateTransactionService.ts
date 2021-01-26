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

    const { total } = await transactionRepo.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You dont have money for pay this!');
    }

    let categoryExists = await categoryRepo.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryExists) {
      categoryExists = categoryRepo.create({
        title: category,
      });

      await categoryRepo.save(categoryExists);
    }

    const transaction = transactionRepo.create({
      title,
      value,
      type,
      category: categoryExists,
    });

    await transactionRepo.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
