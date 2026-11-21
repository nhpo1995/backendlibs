import java.util.ArrayList;
import java.util.List;

class PayrollDemo {
    record Work(String employee, long hours) {}

    // Chữ ký là hợp đồng của tầng nghiệp vụ.
    interface PayPolicy {
        long pay(long hours);
    }

    interface PayrollStore {
        void save(String employee, long amount);
    }

    record HourlyPay(long rate) implements PayPolicy {
        public long pay(long hours) {
            return Math.multiplyExact(hours, rate);
        }
    }

    record BonusPay(PayPolicy base, long bonus) implements PayPolicy {
        public long pay(long hours) {
            return Math.addExact(base.pay(hours), bonus);
        }
    }

    static final class Checkout {
        private final PayPolicy policy;
        private final PayrollStore store;

        Checkout(PayPolicy policy, PayrollStore store) {
            this.policy = policy;
            this.store = store;
        }

        long run(Work work) {
            if (work.hours() < 0) throw new IllegalArgumentException("Giờ làm âm");
            long amount = policy.pay(work.hours());
            store.save(work.employee(), amount);
            return amount;
        }
    }

    public static void main(String[] args) {
        List<String> entries = new ArrayList<>();
        PayrollStore inMemory = (employee, amount) -> entries.add(employee + "=" + amount);
        PayPolicy regular = new HourlyPay(100_000);
        PayPolicy withBonus = new BonusPay(regular, 50_000);
        var work = new Work("An", 8);

        System.out.println(new Checkout(regular, inMemory).run(work));
        System.out.println(new Checkout(withBonus, inMemory).run(work));
        System.out.println(entries);
    }
}
