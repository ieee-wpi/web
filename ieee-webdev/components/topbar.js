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

        <script>
            $(".nav-item a").on("click", function() {
                $(this).removeClass("active");
                $(".nav-item a").addClass("active");
            });
        </script>

        <header id="topbar" class="d-flex align-items-center">
            <div class="container d-flex justify-content-center justify-content-md-between">
                <div class="d-flex align-items-center">
                    <a href="https://www.wpi.edu" class="logo"> <img src="../assets/img/WPI.png" alt="WPI Logo"></a>
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
                    <a href="#" class="instagram"><i class="bx bxl-github"></i></a>
                </div>
            </div>
        </header>
    `
  }
}

customElements.define('top-bar', Header);