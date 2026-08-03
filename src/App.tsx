// Ubah baris state theme di App.tsx menjadi:
  const [theme, setTheme] = useState<'light' | 'dark' | 'pink' | 'purple' | 'green'>(() => {
    const root = document.documentElement;
    if (root.classList.contains('green')) return 'green';
    if (root.classList.contains('purple')) return 'purple';
    if (root.classList.contains('pink')) return 'pink';
    if (root.classList.contains('dark')) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'pink', 'purple', 'green');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'pink') {
      root.classList.add('pink');
    } else if (theme === 'purple') {
      root.classList.add('purple');
    } else if (theme === 'green') {
      root.classList.add('green');
    }
    
    localStorage.setItem('theme', theme);

    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      if (theme === 'dark') metaThemeColor.setAttribute('content', '#09090b');
      else if (theme === 'pink') metaThemeColor.setAttribute('content', '#fff0f3');
      else if (theme === 'purple') metaThemeColor.setAttribute('content', '#f8f0fe');
      else if (theme === 'green') metaThemeColor.setAttribute('content', '#f7fcf5');
      else metaThemeColor.setAttribute('content', '#f8fafc');
    }
  }, [theme]);