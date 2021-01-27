import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
// Criamos essa classe para criar um método getBalance para calcular o balanço das transações
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    // primeiramente eu busco todas as transações
    const transactions = await this.find();

    // faço um reduce nela para calcular o valor de todas as transações
    // tanto income como outcome
    // agora utilizamos a desestruturação para pegar o income e o outcome
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

    // para saber o total diminuimos as transações de saida com as de entrada
    const total = income - outcome;

    return {
      total,
      outcome,
      income,
    };
  }
}

export default TransactionsRepository;
