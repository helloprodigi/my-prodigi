import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.root}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to MyProdigi</h1>
        <p className={styles.lead}>A short description about your product or dashboard.</p>
      </div>
      <div className={styles.image}>
        <Image src="/assets/home/hero.svg" alt="Home hero" width={1200} height={400} />
      </div>
    </section>
  );
}
