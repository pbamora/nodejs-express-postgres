import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const { income, outcome } = transactions.reduce(
      (acc, transaction) => {
        switch (transaction.type) {
          case 'income':
            acc.income += Number(transaction.value);
            break;
          case 'outcome':
            acc.outcome += Number(transaction.value);
            break;
          default:
            break;
        }

        return acc;
      },
      {
        outcome: 0,
        income: 0,
      },
    );

    const total = income - outcome;

    return {
      total,
      outcome,
      income,
    };
  }
}

export default TransactionsRepository;
