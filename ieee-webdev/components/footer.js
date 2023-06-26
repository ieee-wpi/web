class Footer extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = `  
    <!-- Vendor CSS Files -->
    <link href="../assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link href="../assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet">
    <link href="../assets/vendor/boxicons/css/boxicons.min.css" rel="stylesheet">

    <!-- Template Main CSS File -->
    <link href="../assets/css/style.css" rel="stylesheet">

    <!-- ======= Footer ======= -->
    <footer id="footer">
      <div class="footer-top">
        <div class="container">
          <div class="row">
  
            <div class="col-lg-3 col-md-6 footer-contact">
              <h3>WPI IEEE <span>Club</span></h3>
              <p>
                100 Institute Road<br>
                Worcester, MA 01609<br><br>
  
                <strong>Email: </strong>ieee-officers@wpi.edu<br>
              </p>
            </div>
  
            <div class="col-lg-3 col-md-6 footer-links">
              <h4>IEEE Resources</h4>
              <ul>
                <li><i class="bx bx-chevron-right"></i> <a href="http://www.ieee.org/index.html">IEEE.org</a></li>
                <li><i class="bx bx-chevron-right"></i> <a href="http://www.ieee.org/membership_services/membership/students/index.html">IEEE Students</a></li>
                <li><i class="bx bx-chevron-right"></i> <a href="http://users.rcn.com/ieeeworc/">Worcester Section</a></li>
                <li><i class="bx bx-chevron-right"></i> <a href="http://www.ieee.org/sitemap.html">More Sites</a></li>
              </ul>
            </div>
  
            <div class="col-lg-3 col-md-6 footer-links">
              <h4>WPI Resources</h4>
              <ul>
                <li><i class="bx bx-chevron-right"></i> <a href="https://www.wpi.edu">WPI Home</a></li>
                <li><i class="bx bx-chevron-right"></i> <a href="https://www.wpi.edu/offices/career-development-center">Career Development Center</a></li>
                <li><i class="bx bx-chevron-right"></i> <a href="https://www.wpi.edu/about/diversity-inclusion">Diversity, Equity & Inclusion</a></li>
                <li><i class="bx bx-chevron-right"></i> <a href="https://www.wpi.edu/student-experience/resources/be-well-together">Mental Health & Well-Being</a></li>
              </ul>
            </div>
  
            <div class="col-lg-3 col-md-6 footer-links">
              <h4>Our Social Networks</h4>
              <p>Follow us on these social media <br> platforms to get the most recent <br> updates!</p>
              <div class="social-links mt-3">
                <!--TODO: Add link-->
                <a href="#" class="twitter"><i class="bx bxl-twitter"></i></a>
                <a href="#" class="facebook"><i class="bx bxl-facebook"></i></a>
                <a href="#" class="instagram"><i class="bx bxl-instagram"></i></a>
                <a href="#" class="instagram"><i class="bx bxl-github"></i></a>
              </div>
            </div>
  
          </div>
        </div>
      </div>
  
      <div class="copyright-info d-flex justify-content-sm-center">
        <div class=" p-2">
          &copy; Copyright   <strong><span>   WPI IEEE Club  </span></strong> - All Rights Reserved
        </div>
        <div class=" p-2">
            <p class="align-items-center">
                <a href="https://www.ieee.org/about/help/site-terms-conditions.html">Terms & Conditions </a> | 
                <a href="https://www.ieee.org/security-privacy.html"> Privacy Policy </a> | 
                <a href="https://www.ieee.org/about/corporate/governance/p9-26.html">Nondiscrimination Policy</a>
            </p>
        </div>
      </div>
      
    </footer><!-- End Footer -->
    `
  }
}

customElements.define('footer-info', Footer);