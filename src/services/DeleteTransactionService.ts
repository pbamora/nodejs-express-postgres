import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepo = getCustomRepository(TransactionsRepository);

    const existTransaction = await transactionRepo.findOne({
      where: {
        id,
      },
    });

    if (!existTransaction) {
      throw new AppError('this transiction not exists');
    }

    await transactionRepo.remove(existTransaction);
  }
}

export default DeleteTransactionService;
