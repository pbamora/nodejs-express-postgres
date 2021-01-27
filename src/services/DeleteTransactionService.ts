import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepo = getCustomRepository(TransactionsRepository);

    // Procuramos a transação pelo id passado pela rota
    const existTransaction = await transactionRepo.findOne({
      where: {
        id,
      },
    });

    // se não existir lançamos um erro
    if (!existTransaction) {
      throw new AppError('this transiction not exists');
    }

    // do contratrio removemos a transação encontrada.
    await transactionRepo.remove(existTransaction);
  }
}

export default DeleteTransactionService;
