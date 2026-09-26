import styles from './Button.module.css';

export default function Button({ variant = 'ghost', ...props }) {
  return <button type="button" className={styles[variant]} {...props} />;
}
