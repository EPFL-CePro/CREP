export function Footer() {
    return (
        <footer className="footer flex flex-row align-middle justify-center">
            <div >
                <p className="hover:[&>span]:text-red-500 hover:[&>span]:animate-pulse">v.{process.env.npm_package_version} - Coded with <span>♥</span> by CePro - {new Date().getFullYear()}</p>
            </div>
        </footer>
    );
}