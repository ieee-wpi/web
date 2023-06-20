class Header extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = `
        <!-- ======= Top Bar ======= -->

        <!-- Vendor CSS Files -->
        <link href="../assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
        <link href="../assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">
        <link href="../assets/vendor/boxicons/css/boxicons.min.css" rel="stylesheet">

        <!-- Template Main CSS File -->
        <link href="../assets/css/style.css" rel="stylesheet">

        <header id="topbar" class="d-flex align-items-center">
            <div class="container d-flex justify-content-center justify-content-md-between">
                <div class="d-flex align-items-center">
                    <h1 class="logo"><img src="../assets/img/WPI.png" alt="" />
                </div>

                <div class="contact-info d-flex align-items-center">
                    <i class="bi bi-envelope d-flex align-items-center"><a
                            href="ieee-officers@wpi.edu">ieee-officers@wpi.edu</a></i>
                </div>

                <div class="social-links d-none d-md-flex align-items-center">
                    <!-- TODO: add social media link-->
                    <a href="#" class="twitter"><i class="bi bi-twitter" ,></i></a>
                    <a href="#" class="instagram"><i class="bi bi-instagram"></i></a>
                    <a href="#" class="linkedin"><i class="bi bi-linkedin"></i></i></a>
                </div>
            </div>
        </header>

        <!-- ======= Header ======= -->
        <header id="header" class="d-flex align-items-center">
            <div class="container d-flex align-items-center justify-content-between">
            <h1 class="logo"><img src="assets/img/IEEE.png" alt="IEEE Club Logo">
                <a href="https://www.ieee.org/"></a></h1>
            <nav id="navbar" class="navbar">
                <ul>
                <li><a class="nav-link scrollto active" href="#welcome">Home</a></li>
                <li><a class="nav-link scrollto" href="#about">About</a></li>
                <li><a class="nav-link scrollto" href="pages/exec.html">Officer Board</a></li>
                <li class="dropdown"><a href="#services"><span>Events</span> <i class="bi bi-chevron-down"></i></a>
                    <ul>
                    <!-- TODO: add events pages-->
                    <li><a href="/events/paintball.html">Paint Ball</a></li>
                    <li><a href="#">Soldering Workshop</a></li>
                    <li><a href="#">Spark Party</a></li>
                    <li><a href="#">Fox Hunt</a></li>

                    </ul>
                </li>
                <li><a class="nav-link scrollto" href="#team">Team</a></li>
                <li><a class="nav-link scrollto" href="#contact">Contact</a></li>
                </ul>
                <i class="bi bi-list mobile-nav-toggle"></i>
            </nav><!-- .navbar -->
            </div>
        </header>
    `
  }
}

customElements.define('top-bar', Header);